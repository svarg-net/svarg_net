package model

import "time"

// Category модель категории
type Category struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	Slug        string    `json:"slug"`
	Description string    `json:"description,omitempty"`
	ParentID    *int64    `json:"parent_id,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	// Мета-информация для SEO
	MetaTitle       string `json:"meta_title,omitempty"`
	MetaDescription string `json:"meta_description,omitempty"`
	OGImage         string `json:"og_image,omitempty"`
}

// CategoryCreateRequest запрос на создание категории
type CategoryCreateRequest struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	ParentID        *int64 `json:"parent_id,omitempty"`
	MetaTitle       string `json:"meta_title"`
	MetaDescription string `json:"meta_description"`
	OGImage         string `json:"og_image"`
}

// CategoryUpdateRequest запрос на обновление категории
type CategoryUpdateRequest struct {
	Name            *string `json:"name,omitempty"`
	Description     *string `json:"description,omitempty"`
	ParentID        *int64  `json:"parent_id,omitempty"`
	MetaTitle       *string `json:"meta_title,omitempty"`
	MetaDescription *string `json:"meta_description,omitempty"`
	OGImage         *string `json:"og_image,omitempty"`
}

// CategoryListResponse ответ со списком категорий
type CategoryListResponse struct {
	Items []Category `json:"items"`
	Total int        `json:"total"`
}
