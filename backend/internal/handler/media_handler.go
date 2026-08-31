package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"svarg_net/internal/logger"
	"svarg_net/internal/model"
	"svarg_net/internal/service"
)

type MediaHandler struct {
	mediaService service.MediaService
	log          logger.Logger
}

func NewMediaHandler(mediaService service.MediaService, log logger.Logger) *MediaHandler {
	return &MediaHandler{
		mediaService: mediaService,
		log:          log,
	}
}

// Upload POST /api/v1/media
func (h *MediaHandler) Upload(w http.ResponseWriter, r *http.Request) {
	// Парсим multipart form (максимум 10MB)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		h.respondError(w, http.StatusBadRequest, "failed to parse multipart form")
		return
	}

	// Получаем файл из формы
	file, handler, err := r.FormFile("file")
	if err != nil {
		h.respondError(w, http.StatusBadRequest, "file is required")
		return
	}
	defer file.Close()

	// Получаем user_id из контекста (устанавливается в auth middleware)
	user, ok := r.Context().Value("user").(*model.User)
	if !ok {
		h.respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	// Загружаем файл
	mediaFile, err := h.mediaService.Upload(r.Context(), handler, user.ID)
	if err != nil {
		h.log.Error("failed to upload media", "error", err)
		h.respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	h.respondJSON(w, http.StatusCreated, mediaFile)
}

// List GET /api/v1/media
func (h *MediaHandler) List(w http.ResponseWriter, r *http.Request) {
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 20
	offset := 0

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			limit = l
		}
	}

	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil {
			offset = o
		}
	}

	files, err := h.mediaService.List(r.Context(), limit, offset)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondJSON(w, http.StatusOK, map[string]interface{}{
		"items": files,
		"total": len(files),
	})
}

// GetFile GET /api/v1/media/{id}/file
func (h *MediaHandler) GetFile(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	filePath, err := h.mediaService.GetFilePath(r.Context(), id)
	if err != nil {
		h.respondError(w, http.StatusNotFound, "file not found")
		return
	}

	http.ServeFile(w, r, filePath)
}

// Delete DELETE /api/v1/media/{id}
func (h *MediaHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid id")
		return
	}

	if err := h.mediaService.Delete(r.Context(), id); err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondJSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

func (h *MediaHandler) respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		_ = json.NewEncoder(w).Encode(data)
	}
}

func (h *MediaHandler) respondError(w http.ResponseWriter, status int, message string) {
	h.respondJSON(w, status, map[string]string{"error": message})
}
