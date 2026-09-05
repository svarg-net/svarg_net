package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net"
	"net/http"
	"strings"

	"svarg_net/internal/model"
	"svarg_net/internal/repository"
)

type StatsService interface {
	RecordView(ctx context.Context, slug string, r *http.Request) (int64, error)
	GetViews(ctx context.Context, slug string) (int64, error)
	ListPopular(ctx context.Context, limit int) ([]model.PopularPost, error)
	GetAdminStats(ctx context.Context, days int) (*model.AdminStats, error)
}

type statsService struct {
	statsRepo repository.StatsRepository
}

func NewStatsService(statsRepo repository.StatsRepository) StatsService {
	return &statsService{statsRepo: statsRepo}
}

func (s *statsService) RecordView(ctx context.Context, slug string, r *http.Request) (int64, error) {
	hash := viewerHash(r)
	views, err := s.statsRepo.RecordView(ctx, slug, hash)
	if err != nil {
		return 0, fmt.Errorf("failed to record view: %w", err)
	}
	return views, nil
}

func (s *statsService) GetViews(ctx context.Context, slug string) (int64, error) {
	return s.statsRepo.GetViews(ctx, slug)
}

func (s *statsService) ListPopular(ctx context.Context, limit int) ([]model.PopularPost, error) {
	return s.statsRepo.ListPopular(ctx, limit)
}

func (s *statsService) GetAdminStats(ctx context.Context, days int) (*model.AdminStats, error) {
	return s.statsRepo.GetAdminStats(ctx, days)
}

// viewerHash приватный идентификатор посетителя: sha256(IP + User-Agent).
// Сам IP не храним.
func viewerHash(r *http.Request) string {
	ip := ""
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		ip = strings.TrimSpace(strings.Split(xff, ",")[0])
	} else if xrip := r.Header.Get("X-Real-Ip"); xrip != "" {
		ip = xrip
	} else {
		host, _, err := net.SplitHostPort(r.RemoteAddr)
		if err == nil {
			ip = host
		} else {
			ip = r.RemoteAddr
		}
	}
	ua := r.Header.Get("User-Agent")

	h := sha256.Sum256([]byte(ip + "|" + ua))
	return hex.EncodeToString(h[:16])
}
