package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"svarg_net/internal/logger"
	"svarg_net/internal/model"
	"svarg_net/internal/service"
)

// LessonHandler обработчики для уроков
type LessonHandler struct {
	lessonService      service.LessonService
	lessonBlockService service.LessonBlockService
	courseService      service.CourseService
	log                logger.Logger
}

// NewLessonHandler создаёт обработчик уроков
func NewLessonHandler(
	lessonService service.LessonService,
	lessonBlockService service.LessonBlockService,
	courseService service.CourseService,
	log logger.Logger,
) *LessonHandler {
	return &LessonHandler{
		lessonService:      lessonService,
		lessonBlockService: lessonBlockService,
		courseService:      courseService,
		log:                log,
	}
}

// ListLessons GET /api/v1/courses/{slug}/lessons (публично, только published курс)
func (h *LessonHandler) ListLessons(w http.ResponseWriter, r *http.Request) {
	courseSlug := r.PathValue("slug")

	course, err := h.courseService.GetBySlug(r.Context(), courseSlug)
	if err != nil {
		writeJSONError(w, http.StatusNotFound, "course not found")
		return
	}
	if course.Status != model.CourseStatusPublished {
		writeJSONError(w, http.StatusNotFound, "course not found")
		return
	}

	lessons, err := h.lessonService.ListByCourseID(r.Context(), course.ID)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, model.LessonListResponse{
		Items: lessons,
		Total: len(lessons),
	})
}

// ListLessonsAdmin GET /api/v1/admin/courses/{id}/lessons
func (h *LessonHandler) ListLessonsAdmin(w http.ResponseWriter, r *http.Request) {
	courseID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid course id")
		return
	}

	lessons, err := h.lessonService.ListByCourseID(r.Context(), courseID)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, model.LessonListResponse{
		Items: lessons,
		Total: len(lessons),
	})
}

// GetLesson GET /api/v1/courses/{slug}/lessons/{lessonSlug} (публично)
func (h *LessonHandler) GetLesson(w http.ResponseWriter, r *http.Request) {
	courseSlug := r.PathValue("slug")
	lessonSlug := r.PathValue("lessonSlug")

	course, err := h.courseService.GetBySlug(r.Context(), courseSlug)
	if err != nil {
		writeJSONError(w, http.StatusNotFound, "course not found")
		return
	}
	if course.Status != model.CourseStatusPublished {
		writeJSONError(w, http.StatusNotFound, "course not found")
		return
	}

	lesson, err := h.lessonService.GetByCourseAndSlug(r.Context(), course.ID, lessonSlug)
	if err != nil {
		writeJSONError(w, http.StatusNotFound, "lesson not found")
		return
	}

	writeJSON(w, http.StatusOK, lesson)
}

// GetLessonAdmin GET /api/v1/admin/lessons/{id}
func (h *LessonHandler) GetLessonAdmin(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid lesson id")
		return
	}

	lesson, err := h.lessonService.GetByID(r.Context(), id)
	if err != nil {
		writeJSONError(w, http.StatusNotFound, "lesson not found")
		return
	}

	writeJSON(w, http.StatusOK, lesson)
}

// CreateLesson POST /api/v1/admin/courses/{id}/lessons
func (h *LessonHandler) CreateLesson(w http.ResponseWriter, r *http.Request) {
	courseID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid course id")
		return
	}

	var data model.LessonCreateData
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	data.CourseID = courseID

	lesson, err := h.lessonService.Create(r.Context(), data)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, lesson)
}

// UpdateLesson PATCH /api/v1/admin/lessons/{id}
func (h *LessonHandler) UpdateLesson(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid lesson id")
		return
	}

	var upd model.LessonUpdateData
	if err := json.NewDecoder(r.Body).Decode(&upd); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	lesson, err := h.lessonService.Update(r.Context(), id, upd)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, lesson)
}

// DeleteLesson DELETE /api/v1/admin/lessons/{id}
func (h *LessonHandler) DeleteLesson(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid lesson id")
		return
	}

	if err := h.lessonService.Delete(r.Context(), id); err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "lesson deleted"})
}

// ReorderLessons POST /api/v1/admin/courses/{id}/lessons/reorder
func (h *LessonHandler) ReorderLessons(w http.ResponseWriter, r *http.Request) {
	courseID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid course id")
		return
	}

	var req struct {
		LessonIDs []int64 `json:"lesson_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.lessonService.Reorder(r.Context(), courseID, req.LessonIDs); err != nil {
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "lessons reordered"})
}

// ListLessonBlocks GET /api/v1/admin/lessons/{id}/blocks
func (h *LessonHandler) ListLessonBlocks(w http.ResponseWriter, r *http.Request) {
	lessonID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid lesson id")
		return
	}

	blocks, err := h.lessonBlockService.ListForAdmin(r.Context(), lessonID)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"items": blocks})
}

// CreateLessonBlock POST /api/v1/admin/lessons/{id}/blocks
func (h *LessonHandler) CreateLessonBlock(w http.ResponseWriter, r *http.Request) {
	lessonID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid lesson id")
		return
	}

	var data model.BlockCreateData
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	data.PostID = lessonID // PostID в модели Block хранит owner_id

	block, err := h.lessonBlockService.Create(r.Context(), data)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, block)
}

// UpdateLessonBlock PATCH /api/v1/admin/lesson-blocks/{id}
func (h *LessonHandler) UpdateLessonBlock(w http.ResponseWriter, r *http.Request) {
	blockID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid block id")
		return
	}

	var upd model.BlockUpdateData
	if err := json.NewDecoder(r.Body).Decode(&upd); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	block, err := h.lessonBlockService.Update(r.Context(), blockID, upd)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, block)
}

// DeleteLessonBlock DELETE /api/v1/admin/lesson-blocks/{id}
func (h *LessonHandler) DeleteLessonBlock(w http.ResponseWriter, r *http.Request) {
	blockID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid block id")
		return
	}

	if err := h.lessonBlockService.Delete(r.Context(), blockID); err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "block deleted"})
}

// ReorderLessonBlocks POST /api/v1/admin/lessons/{id}/blocks/reorder
func (h *LessonHandler) ReorderLessonBlocks(w http.ResponseWriter, r *http.Request) {
	lessonID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid lesson id")
		return
	}

	var req struct {
		BlockIDs []int64 `json:"block_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.lessonBlockService.Reorder(r.Context(), lessonID, req.BlockIDs); err != nil {
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "blocks reordered"})
}

// ListLessonBlocksPublic GET /api/v1/lessons/{id}/blocks (публично)
func (h *LessonHandler) ListLessonBlocksPublic(w http.ResponseWriter, r *http.Request) {
	lessonID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid lesson id")
		return
	}

	_, err = h.lessonService.GetByID(r.Context(), lessonID)
	if err != nil {
		writeJSONError(w, http.StatusNotFound, "lesson not found")
		return
	}

	// Доступ: is_free — всем, платные — только записанным на курс
	var userID int64
	if user, ok := getUserFromRequest(r); ok {
		userID = user.ID
	}

	blocks, err := h.lessonBlockService.ListPublicWithAccess(r.Context(), lessonID, userID)
	if err != nil {
		if errors.Is(err, service.ErrEnrollmentRequired) {
			writeJSONError(w, http.StatusForbidden, "enrollment_required")
			return
		}
		writeJSONError(w, http.StatusNotFound, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"items": blocks})
}
