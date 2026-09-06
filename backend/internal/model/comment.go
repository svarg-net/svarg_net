package model

import "time"

// Статусы комментария
const (
	CommentStatusPending  = "pending"
	CommentStatusApproved = "approved"
	CommentStatusRejected = "rejected"
)

// Comment комментарий к посту
type Comment struct {
	ID          int64     `json:"id"`
	PostID      int64     `json:"post_id"`
	ParentID    *int64    `json:"parent_id,omitempty"`
	AuthorName  string    `json:"author_name"`
	AuthorEmail *string   `json:"-"` // не публикуется в API (только Gravatar hash)
	Content     string    `json:"content"`
	Status      string    `json:"status"`
	IPHash      string    `json:"-"` // не публикуется
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Вычисляемые поля для API
	Replies    []Comment `json:"replies,omitempty"`
	GravatarID string    `json:"gravatar_id,omitempty"` // MD5 от email для аватара
}

// CommentCreateData данные для создания комментария
type CommentCreateData struct {
	PostID      int64   `json:"post_id"`
	ParentID    *int64  `json:"parent_id,omitempty"`
	AuthorName  string  `json:"author_name"`
	AuthorEmail *string `json:"author_email,omitempty"` // отдаётся только в админских эндпоинтах
	Content     string  `json:"content"`
}

// CommentListResponse ответ со списком комментариев
type CommentListResponse struct {
	Items []Comment `json:"items"`
	Total int       `json:"total"`
}
