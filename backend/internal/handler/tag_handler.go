package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"svarg_net/internal/logger"
	"svarg_net/internal/model"
	"svarg_net/internal/service"
)

// TagHandler обработчики для тегов
type TagHandler struct {
	service service.TagService
	log     logger.Logger
}

// NewTagHandler создаёт новый обработчик тегов
func NewTagHandler(service service.TagService, log logger.Logger) *TagHandler {
	return &TagHandler{
		service: service,
		log:     log,
	}
}

// ListTags GET /api/v1/tags
func (h *TagHandler) ListTags(w http.ResponseWriter, r *http.Request) {
	response, err := h.service.List(r.Context())
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondJSON(w, http.StatusOK, response)
}

// GetTag GET /api/v1/tags/{slug}
func (h *TagHandler) GetTag(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		h.respondError(w, http.StatusBadRequest, "slug is required")
		return
	}

	tag, err := h.service.GetBySlug(r.Context(), slug)
	if err != nil {
		h.respondError(w, http.StatusNotFound, "tag not found")
		return
	}

	h.respondJSON(w, http.StatusOK, tag)
}

// CreateTag POST /api/v1/tags
func (h *TagHandler) CreateTag(w http.ResponseWriter, r *http.Request) {
	var req model.TagCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	tag, err := h.service.Create(r.Context(), &req)
	if err != nil {
		h.respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	h.respondJSON(w, http.StatusCreated, tag)
}

// UpdateTag PATCH /api/v1/tags/{id}
func (h *TagHandler) UpdateTag(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid tag id")
		return
	}

	var req model.TagUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	tag, err := h.service.Update(r.Context(), id, &req)
	if err != nil {
		h.respondError(w, http.StatusNotFound, "tag not found")
		return
	}

	h.respondJSON(w, http.StatusOK, tag)
}

// DeleteTag DELETE /api/v1/tags/{id}
func (h *TagHandler) DeleteTag(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid tag id")
		return
	}

	if err := h.service.Delete(r.Context(), id); err != nil {
		h.respondError(w, http.StatusNotFound, "tag not found")
		return
	}

	h.respondJSON(w, http.StatusNoContent, nil)
}

// respondJSON отправляет JSON ответ
func (h *TagHandler) respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		_ = json.NewEncoder(w).Encode(data)
	}
}

// respondError отправляет ошибку
func (h *TagHandler) respondError(w http.ResponseWriter, status int, message string) {
	h.respondJSON(w, status, map[string]string{
		"error": message,
	})
}
