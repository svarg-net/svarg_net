package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"svarg_net/internal/logger"
	"svarg_net/internal/model"
	"svarg_net/internal/service"
)

// CategoryHandler обработчики для категорий
type CategoryHandler struct {
	service service.CategoryService
	log     logger.Logger
}

// NewCategoryHandler создаёт новый обработчик категорий
func NewCategoryHandler(service service.CategoryService, log logger.Logger) *CategoryHandler {
	return &CategoryHandler{
		service: service,
		log:     log,
	}
}

// ListCategories GET /api/v1/categories
func (h *CategoryHandler) ListCategories(w http.ResponseWriter, r *http.Request) {
	response, err := h.service.List(r.Context())
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondJSON(w, http.StatusOK, response)
}

// GetCategory GET /api/v1/categories/{slug}
func (h *CategoryHandler) GetCategory(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		h.respondError(w, http.StatusBadRequest, "slug is required")
		return
	}

	category, err := h.service.GetBySlug(r.Context(), slug)
	if err != nil {
		h.respondError(w, http.StatusNotFound, "category not found")
		return
	}

	h.respondJSON(w, http.StatusOK, category)
}

// CreateCategory POST /api/v1/categories
func (h *CategoryHandler) CreateCategory(w http.ResponseWriter, r *http.Request) {
	var req model.CategoryCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	category, err := h.service.Create(r.Context(), &req)
	if err != nil {
		h.respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	h.respondJSON(w, http.StatusCreated, category)
}

// UpdateCategory PATCH /api/v1/categories/{id}
func (h *CategoryHandler) UpdateCategory(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid category id")
		return
	}

	var req model.CategoryUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	category, err := h.service.Update(r.Context(), id, &req)
	if err != nil {
		h.respondError(w, http.StatusNotFound, "category not found")
		return
	}

	h.respondJSON(w, http.StatusOK, category)
}

// DeleteCategory DELETE /api/v1/categories/{id}
func (h *CategoryHandler) DeleteCategory(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid category id")
		return
	}

	if err := h.service.Delete(r.Context(), id); err != nil {
		h.respondError(w, http.StatusNotFound, "category not found")
		return
	}

	h.respondJSON(w, http.StatusNoContent, nil)
}

// respondJSON отправляет JSON ответ
func (h *CategoryHandler) respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		_ = json.NewEncoder(w).Encode(data)
	}
}

// respondError отправляет ошибку
func (h *CategoryHandler) respondError(w http.ResponseWriter, status int, message string) {
	h.respondJSON(w, status, map[string]string{
		"error": message,
	})
}
