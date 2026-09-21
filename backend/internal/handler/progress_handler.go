package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"svarg_net/internal/logger"
	"svarg_net/internal/service"
)

// ProgressHandler обработчики прогресса
type ProgressHandler struct {
	progressService service.ProgressService
	log             logger.Logger
}

// NewProgressHandler создаёт обработчик прогресса
func NewProgressHandler(progressService service.ProgressService, log logger.Logger) *ProgressHandler {
	return &ProgressHandler{
		progressService: progressService,
		log:             log,
	}
}

// MarkComplete POST /api/v1/lessons/{id}/complete
func (h *ProgressHandler) MarkComplete(w http.ResponseWriter, r *http.Request) {
	user, ok := getUserFromRequest(r)
	if !ok {
		writeJSONError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	userID := user.ID

	lessonID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid lesson id")
		return
	}

	progress, err := h.progressService.MarkComplete(r.Context(), userID, lessonID)
	if err != nil {
		writeJSONError(w, http.StatusForbidden, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, progress)
}

// SubmitQuiz POST /api/v1/lessons/{id}/quiz
func (h *ProgressHandler) SubmitQuiz(w http.ResponseWriter, r *http.Request) {
	user, ok := getUserFromRequest(r)
	if !ok {
		writeJSONError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	userID := user.ID

	lessonID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid lesson id")
		return
	}

	var req struct {
		Score int `json:"score"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Score < 0 || req.Score > 100 {
		writeJSONError(w, http.StatusBadRequest, "score must be between 0 and 100")
		return
	}

	progress, err := h.progressService.SubmitQuiz(r.Context(), userID, lessonID, req.Score)
	if err != nil {
		writeJSONError(w, http.StatusForbidden, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, progress)
}

// GetCourseProgress GET /api/v1/me/courses/{id}/progress
func (h *ProgressHandler) GetCourseProgress(w http.ResponseWriter, r *http.Request) {
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

	summary, err := h.progressService.GetCourseProgress(r.Context(), userID, courseID)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, summary)
}

// GetLessonProgress GET /api/v1/lessons/{id}/progress
func (h *ProgressHandler) GetLessonProgress(w http.ResponseWriter, r *http.Request) {
	user, ok := getUserFromRequest(r)
	if !ok {
		writeJSONError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	userID := user.ID

	lessonID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid lesson id")
		return
	}

	progress, err := h.progressService.GetLessonProgress(r.Context(), userID, lessonID)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Если прогресса нет — возвращаем пустой объект
	if progress == nil {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"completed": false,
			"quiz_score": nil,
		})
		return
	}

	writeJSON(w, http.StatusOK, progress)
}
