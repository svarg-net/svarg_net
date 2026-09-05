package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"svarg_net/internal/logger"
	"svarg_net/internal/service"
)

type StatsHandler struct {
	statsService service.StatsService
	log          logger.Logger
}

func NewStatsHandler(statsService service.StatsService, log logger.Logger) *StatsHandler {
	return &StatsHandler{
		statsService: statsService,
		log:          log,
	}
}

// RecordView POST /api/v1/posts/{slug}/view
func (h *StatsHandler) RecordView(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")

	views, err := h.statsService.RecordView(r.Context(), slug, r)
	if err != nil {
		h.log.Error("record view failed", "error", err, "slug", slug)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "post not found"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]int64{"views": views})
}

// GetViews GET /api/v1/posts/{slug}/views
func (h *StatsHandler) GetViews(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")

	views, err := h.statsService.GetViews(r.Context(), slug)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "post not found"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]int64{"views": views})
}

// ListPopular GET /api/v1/posts/popular
func (h *StatsHandler) ListPopular(w http.ResponseWriter, r *http.Request) {
	limit := 5
	if l := r.URL.Query().Get("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil {
			limit = v
		}
	}

	posts, err := h.statsService.ListPopular(r.Context(), limit)
	if err != nil {
		h.log.Error("list popular failed", "error", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "failed to load popular posts"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"items": posts})
}

// GetAdminStats GET /api/v1/admin/stats?days=30
func (h *StatsHandler) GetAdminStats(w http.ResponseWriter, r *http.Request) {
	days := 30
	if d := r.URL.Query().Get("days"); d != "" {
		if v, err := strconv.Atoi(d); err == nil {
			days = v
		}
	}

	stats, err := h.statsService.GetAdminStats(r.Context(), days)
	if err != nil {
		h.log.Error("admin stats failed", "error", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "failed to load stats"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(stats)
}
