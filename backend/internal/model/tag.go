package model

import "time"

// Tag модель тега
type Tag struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	CreatedAt time.Time `json:"created_at"`
	// Мета-информация для SEO
	MetaTitle       string `json:"meta_title,omitempty"`
	MetaDescription string `json:"meta_description,omitempty"`
	OGImage         string `json:"og_image,omitempty"`
}

// TagCreateRequest запрос на создание тега
type TagCreateRequest struct {
	Name            string `json:"name"`
	MetaTitle       string `json:"meta_title"`
	MetaDescription string `json:"meta_description"`
	OGImage         string `json:"og_image"`
}

// TagListResponse ответ со списком тегов
type TagListResponse struct {
	Items []Tag `json:"items"`
	Total int   `json:"total"`
}

// TagUpdateRequest запрос на обновление тега
type TagUpdateRequest struct {
	Name            *string `json:"name,omitempty"`
	MetaTitle       *string `json:"meta_title,omitempty"`
	MetaDescription *string `json:"meta_description,omitempty"`
	OGImage         *string `json:"og_image,omitempty"`
}
