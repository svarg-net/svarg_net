package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"svarg_net/internal/model"
)

type StatsRepository interface {
	RecordView(ctx context.Context, slug string, viewerHash string) (int64, error)
	GetViews(ctx context.Context, slug string) (int64, error)
	ListPopular(ctx context.Context, limit int) ([]model.PopularPost, error)
	GetAdminStats(ctx context.Context, days int) (*model.AdminStats, error)
}

type statsRepository struct {
	pool *pgxpool.Pool
}

func NewStatsRepository(pool *pgxpool.Pool) StatsRepository {
	return &statsRepository{pool: pool}
}

// RecordView записывает просмотр и инкрементит счётчик.
// Возвращает актуальное число просмотров поста.
func (r *statsRepository) RecordView(ctx context.Context, slug string, viewerHash string) (int64, error) {
	var postID int64
	err := r.pool.QueryRow(ctx, `SELECT id FROM posts WHERE slug = $1`, slug).Scan(&postID)
	if err != nil {
		return 0, err
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx,
		`INSERT INTO post_views (post_id, viewer_hash) VALUES ($1, $2)`,
		postID, viewerHash,
	)
	if err != nil {
		return 0, err
	}

	var views int64
	err = tx.QueryRow(ctx,
		`UPDATE posts SET views_count = views_count + 1 WHERE id = $1 RETURNING views_count`,
		postID,
	).Scan(&views)
	if err != nil {
		return 0, err
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}
	return views, nil
}

func (r *statsRepository) GetViews(ctx context.Context, slug string) (int64, error) {
	var views int64
	err := r.pool.QueryRow(ctx,
		`SELECT views_count FROM posts WHERE slug = $1`, slug,
	).Scan(&views)
	if err != nil {
		return 0, err
	}
	return views, nil
}

func (r *statsRepository) ListPopular(ctx context.Context, limit int) ([]model.PopularPost, error) {
	if limit <= 0 || limit > 20 {
		limit = 5
	}

	rows, err := r.pool.Query(ctx, `
		SELECT id, title, slug, views_count
		FROM posts
		WHERE status = 'published' AND views_count > 0
		ORDER BY views_count DESC
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []model.PopularPost
	for rows.Next() {
		var p model.PopularPost
		if err := rows.Scan(&p.ID, &p.Title, &p.Slug, &p.Views); err != nil {
			return nil, err
		}
		posts = append(posts, p)
	}
	return posts, nil
}

func (r *statsRepository) GetAdminStats(ctx context.Context, days int) (*model.AdminStats, error) {
	if days <= 0 || days > 365 {
		days = 30
	}

	stats := &model.AdminStats{
		Posts: []model.PostStats{},
		Daily: []model.DailyStats{},
	}

	// Сводка
	err := r.pool.QueryRow(ctx, `
		SELECT
			COUNT(*)::bigint,
			COUNT(DISTINCT viewer_hash)::bigint,
			COUNT(*) FILTER (WHERE created_at >= now() - interval '1 day')::bigint,
			COUNT(DISTINCT viewer_hash) FILTER (WHERE created_at >= now() - interval '1 day')::bigint
		FROM post_views
	`).Scan(
		&stats.Summary.TotalViews,
		&stats.Summary.TotalUnique,
		&stats.Summary.ViewsToday,
		&stats.Summary.UniqueToday,
	)
	if err != nil {
		return nil, err
	}

	// По постам
	rows, err := r.pool.Query(ctx, `
		SELECT
			p.id, p.title, p.slug,
			COUNT(v.id)::bigint AS views,
			COUNT(DISTINCT v.viewer_hash)::bigint AS unique,
			MAX(v.created_at) AS last_view_at
		FROM posts p
		LEFT JOIN post_views v ON v.post_id = p.id
		GROUP BY p.id, p.title, p.slug
		HAVING COUNT(v.id) > 0
		ORDER BY views DESC
		LIMIT 50
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var s model.PostStats
		if err := rows.Scan(&s.ID, &s.Title, &s.Slug, &s.Views, &s.Unique, &s.LastViewAt); err != nil {
			return nil, err
		}
		stats.Posts = append(stats.Posts, s)
	}

	// По дням (исправленный запрос)
	dailyRows, err := r.pool.Query(ctx, `
		SELECT
			to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS d,
			COUNT(*)::bigint AS views,
			COUNT(DISTINCT viewer_hash)::bigint AS unique
		FROM post_views
		WHERE created_at >= now() - make_interval(days => $1::int)
		GROUP BY d
		ORDER BY d
	`, days)
	if err != nil {
		return nil, err
	}
	defer dailyRows.Close()

	for dailyRows.Next() {
		var d model.DailyStats
		if err := dailyRows.Scan(&d.Date, &d.Views, &d.Unique); err != nil {
			return nil, err
		}
		stats.Daily = append(stats.Daily, d)
	}

	return stats, nil
}
