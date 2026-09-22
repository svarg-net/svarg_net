package handler

import (
	"net/http"
	"strconv"

	"svarg_net/internal/logger"
	"svarg_net/internal/service"
)

// EnrollmentHandler обработчики записей на курсы
type EnrollmentHandler struct {
	enrollmentService service.EnrollmentService
	log               logger.Logger
}

// NewEnrollmentHandler создаёт обработчик записей
func NewEnrollmentHandler(enrollmentService service.EnrollmentService, log logger.Logger) *EnrollmentHandler {
	return &EnrollmentHandler{
		enrollmentService: enrollmentService,
		log:               log,
	}
}

// Enroll POST /api/v1/courses/{slug}/enroll
func (h *EnrollmentHandler) Enroll(w http.ResponseWriter, r *http.Request) {
	user, ok := getUserFromRequest(r)
	if !ok {
		writeJSONError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	userID := user.ID

	slug := r.PathValue("slug")
	if slug == "" {
		writeJSONError(w, http.StatusBadRequest, "slug is required")
		return
	}

	enrollment, err := h.enrollmentService.Enroll(r.Context(), userID, slug)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message":    "enrolled",
		"enrollment": enrollment,
	})
}

// ListMyEnrollments GET /api/v1/me/enrollments
func (h *EnrollmentHandler) ListMyEnrollments(w http.ResponseWriter, r *http.Request) {
	user, ok := getUserFromRequest(r)
	if !ok {
		writeJSONError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	userID := user.ID

	enrollments, err := h.enrollmentService.ListMyEnrollments(r.Context(), userID)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"items": enrollments,
		"total": len(enrollments),
	})
}

// GetEnrollmentStatus GET /api/v1/courses/{id}/enrollment-status
func (h *EnrollmentHandler) GetEnrollmentStatus(w http.ResponseWriter, r *http.Request) {
	user, ok := getUserFromRequest(r)
	if !ok {
		writeJSONError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	userID := user.ID

	courseID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid course id")
		return
	}

	enrolled, err := h.enrollmentService.IsEnrolled(r.Context(), userID, courseID)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"enrolled": enrolled,
	})
}
