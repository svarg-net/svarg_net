package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"svarg_net/internal/logger"
	"svarg_net/internal/model"
	"svarg_net/internal/service"
)

// CourseHandler обработчики для курсов
type CourseHandler struct {
	courseService service.CourseService
	log           logger.Logger
}

// NewCourseHandler создаёт обработчик курсов
func NewCourseHandler(courseService service.CourseService, log logger.Logger) *CourseHandler {
	return &CourseHandler{courseService: courseService, log: log}
}

// ListCourses GET /api/v1/courses (публично) или GET /api/v1/admin/courses (админ)
func (h *CourseHandler) ListCourses(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	if status == "" {
		status = model.CourseStatusPublished
	}

	courses, err := h.courseService.List(r.Context(), status)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, model.CourseListResponse{
		Items: courses,
		Total: len(courses),
	})
}

// ListCoursesAdmin GET /api/v1/admin/courses (все статусы)
func (h *CourseHandler) ListCoursesAdmin(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status") // "" = все

	courses, err := h.courseService.List(r.Context(), status)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, model.CourseListResponse{
		Items: courses,
		Total: len(courses),
	})
}

// GetCourse GET /api/v1/courses/{slug} (публично)
func (h *CourseHandler) GetCourse(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")

	course, err := h.courseService.GetBySlug(r.Context(), slug)
	if err != nil {
		writeJSONError(w, http.StatusNotFound, "course not found")
		return
	}

	writeJSON(w, http.StatusOK, course)
}

// GetCourseAdmin GET /api/v1/admin/courses/{id}
func (h *CourseHandler) GetCourseAdmin(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid course id")
		return
	}

	course, err := h.courseService.GetByID(r.Context(), id)
	if err != nil {
		writeJSONError(w, http.StatusNotFound, "course not found")
		return
	}

	writeJSON(w, http.StatusOK, course)
}

// CreateCourse POST /api/v1/admin/courses
func (h *CourseHandler) CreateCourse(w http.ResponseWriter, r *http.Request) {
	var data model.CourseCreateData
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	course, err := h.courseService.Create(r.Context(), data)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, course)
}

// UpdateCourse PATCH /api/v1/admin/courses/{id}
func (h *CourseHandler) UpdateCourse(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid course id")
		return
	}

	var upd model.CourseUpdateData
	if err := json.NewDecoder(r.Body).Decode(&upd); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	course, err := h.courseService.Update(r.Context(), id, upd)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, course)
}

// DeleteCourse DELETE /api/v1/admin/courses/{id}
func (h *CourseHandler) DeleteCourse(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid course id")
		return
	}

	if err := h.courseService.Delete(r.Context(), id); err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "course deleted"})
}
