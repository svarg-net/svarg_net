package model

import "time"

// Post статусы
const (
	PostStatusDraft     = "draft"
	PostStatusPublished = "published"
	PostStatusArchived  = "archived"
)

// Post модель поста
type Post struct {
	ID          int64      `json:"id"`
	AuthorID    int64      `json:"author_id"`
	Slug        string     `json:"slug"`
	Title       string     `json:"title"`
	Excerpt     string     `json:"excerpt,omitempty"`
	ContentMD   string     `json:"content_md"`
	Status      string     `json:"status"`
	PublishedAt *time.Time `json:"published_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// PostCreateRequest запрос на создание поста
type PostCreateRequest struct {
	Title     string `json:"title"`
	Excerpt   string `json:"excerpt"`
	ContentMD string `json:"content_md"`
	Status    string `json:"status"`
}

// PostUpdateRequest запрос на обновление поста
type PostUpdateRequest struct {
	Title     *string `json:"title,omitempty"`
	Excerpt   *string `json:"excerpt,omitempty"`
	ContentMD *string `json:"content_md,omitempty"`
	Status    *string `json:"status,omitempty"`
}

// PostListResponse ответ со списком постов
type PostListResponse struct {
	Items   []Post `json:"items"`
	Total   int    `json:"total"`
	Page    int    `json:"page"`
	PerPage int    `json:"per_page"`
}
