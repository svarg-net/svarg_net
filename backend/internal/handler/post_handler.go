package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"svarg_net/internal/logger"
	"svarg_net/internal/model"
	"svarg_net/internal/service"
)

// PostHandler обработчики для постов
type PostHandler struct {
	service service.PostService
	log     logger.Logger
}

// NewPostHandler создаёт новый обработчик постов
func NewPostHandler(service service.PostService, log logger.Logger) *PostHandler {
	return &PostHandler{
		service: service,
		log:     log,
	}
}

// ListPosts GET /api/v1/posts
func (h *PostHandler) ListPosts(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	pageStr := r.URL.Query().Get("page")
	perPageStr := r.URL.Query().Get("per_page")

	page := 1
	perPage := 20

	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	if perPageStr != "" {
		if p, err := strconv.Atoi(perPageStr); err == nil && p > 0 {
			perPage = p
		}
	}

	response, err := h.service.List(r.Context(), status, page, perPage)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondJSON(w, http.StatusOK, response)
}

// GetPost GET /api/v1/posts/{slug}
func (h *PostHandler) GetPost(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		h.respondError(w, http.StatusBadRequest, "slug is required")
		return
	}

	post, err := h.service.GetBySlug(r.Context(), slug)
	if err != nil {
		h.respondError(w, http.StatusNotFound, "post not found")
		return
	}

	h.respondJSON(w, http.StatusOK, post)
}

// CreatePost POST /api/v1/posts
func (h *PostHandler) CreatePost(w http.ResponseWriter, r *http.Request) {
	var req model.PostCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	post, err := h.service.Create(r.Context(), &req)
	if err != nil {
		h.respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	h.respondJSON(w, http.StatusCreated, post)
}

// UpdatePost PATCH /api/v1/posts/{id}
func (h *PostHandler) UpdatePost(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid post id")
		return
	}

	var req model.PostUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	post, err := h.service.Update(r.Context(), id, &req)
	if err != nil {
		h.respondError(w, http.StatusNotFound, "post not found")
		return
	}

	h.respondJSON(w, http.StatusOK, post)
}

// DeletePost DELETE /api/v1/posts/{id}
func (h *PostHandler) DeletePost(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid post id")
		return
	}

	if err := h.service.Delete(r.Context(), id); err != nil {
		h.respondError(w, http.StatusNotFound, "post not found")
		return
	}

	h.respondJSON(w, http.StatusNoContent, nil)
}

// respondJSON отправляет JSON ответ
func (h *PostHandler) respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		_ = json.NewEncoder(w).Encode(data)
	}
}

// respondError отправляет ошибку
func (h *PostHandler) respondError(w http.ResponseWriter, status int, message string) {
	h.respondJSON(w, status, map[string]string{
		"error": message,
	})
}
