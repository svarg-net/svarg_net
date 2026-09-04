package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"svarg_net/internal/logger"
	"svarg_net/internal/service"
)

type SearchHandler struct {
	searchService service.SearchService
	log           logger.Logger
}

func NewSearchHandler(searchService service.SearchService, log logger.Logger) *SearchHandler {
	return &SearchHandler{
		searchService: searchService,
		log:           log,
	}
}

func (h *SearchHandler) Search(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		h.respondJSON(w, http.StatusOK, map[string]interface{}{
			"items": []interface{}{},
			"total": 0,
		})
		return
	}

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

	results, err := h.searchService.Search(r.Context(), query, limit, offset)
	if err != nil {
		h.log.Error("search failed", "error", err, "query", query)
		h.respondError(w, http.StatusInternalServerError, "search failed")
		return
	}

	h.respondJSON(w, http.StatusOK, map[string]interface{}{
		"items": results,
		"total": len(results),
		"query": query,
	})
}

func (h *SearchHandler) respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		_ = json.NewEncoder(w).Encode(data)
	}
}

func (h *SearchHandler) respondError(w http.ResponseWriter, status int, message string) {
	h.respondJSON(w, status, map[string]string{"error": message})
}
