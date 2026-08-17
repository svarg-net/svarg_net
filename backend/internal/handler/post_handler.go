package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"svarg_net/internal/logger"
	"svarg_net/internal/model"
	"svarg_net/internal/service"
)

type PostHandler struct {
	service         service.PostService
	categoryService service.CategoryService
	tagService      service.TagService
	log             logger.Logger
}

func NewPostHandler(
	service service.PostService,
	categoryService service.CategoryService,
	tagService service.TagService,
	log logger.Logger,
) *PostHandler {
	return &PostHandler{
		service:         service,
		categoryService: categoryService,
		tagService:      tagService,
		log:             log,
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

// ListPostsByCategory GET /api/v1/categories/{slug}/posts
func (h *PostHandler) ListPostsByCategory(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		h.respondError(w, http.StatusBadRequest, "slug is required")
		return
	}

	// Получаем категорию по slug
	category, err := h.categoryService.GetBySlug(r.Context(), slug)
	if err != nil {
		h.respondError(w, http.StatusNotFound, "category not found")
		return
	}

	status := r.URL.Query().Get("status")
	if status == "" {
		status = "published"
	}

	page := 1
	perPage := 20

	response, err := h.service.ListByCategory(r.Context(), category.ID, status, page, perPage)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondJSON(w, http.StatusOK, response)
}

// ListPostsByTag GET /api/v1/tags/{slug}/posts
func (h *PostHandler) ListPostsByTag(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		h.respondError(w, http.StatusBadRequest, "slug is required")
		return
	}

	// Получаем тег по slug
	tag, err := h.tagService.GetBySlug(r.Context(), slug)
	if err != nil {
		h.respondError(w, http.StatusNotFound, "tag not found")
		return
	}

	status := r.URL.Query().Get("status")
	if status == "" {
		status = "published"
	}

	page := 1
	perPage := 20

	response, err := h.service.ListByTag(r.Context(), tag.ID, status, page, perPage)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondJSON(w, http.StatusOK, response)
}
