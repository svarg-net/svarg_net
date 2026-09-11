package repository

import (
	"fmt"

	"svarg_net/internal/model"

	"github.com/jackc/pgx/v5"
)

// postColumns — единый список колонок для всех SELECT постов.
// Порядок ВАЖЕН: он совпадает со scanPost.
const postColumns = `id, author_id, slug, title, excerpt, content_md, content_json,
	status, published_at, created_at, updated_at,
	COALESCE(meta_title, ''), COALESCE(meta_description, ''), COALESCE(meta_keywords, '{}'), COALESCE(og_image, ''),
	category_id, comments_enabled, views_count, content_mode`

// scanPost читает одну строку поста в модель.
// Возвращает (nil, nil) если строк нет.
func scanPost(row pgx.Row) (*model.Post, error) {
	var p model.Post
	err := row.Scan(
		&p.ID, &p.AuthorID, &p.Slug, &p.Title, &p.Excerpt,
		&p.ContentMD, &p.ContentJSON, &p.Status, &p.PublishedAt,
		&p.CreatedAt, &p.UpdatedAt,
		&p.MetaTitle, &p.MetaDescription, &p.MetaKeywords, &p.OGImage,
		&p.CategoryID, &p.CommentsEnabled, &p.ViewsCount, &p.ContentMode,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to scan post: %w", err)
	}
	return &p, nil
}

// scanPosts читает все строки результата в срез постов.
func scanPosts(rows pgx.Rows) ([]model.Post, error) {
	defer rows.Close()

	posts := []model.Post{}
	for rows.Next() {
		p, err := scanPost(rows)
		if err != nil {
			return nil, err
		}
		if p != nil {
			posts = append(posts, *p)
		}
	}
	return posts, nil
}
