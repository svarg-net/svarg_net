package model

// AdminPollItem — опрос для админ-сводки
type AdminPollItem struct {
	BlockID   int64    `json:"block_id"`
	PostID    int64    `json:"post_id"`
	PostTitle string   `json:"post_title"`
	PostSlug  string   `json:"post_slug"`
	Question  string   `json:"question"`
	Options   []string `json:"options"`
	Multiple  bool     `json:"multiple"`
	Counts    []int    `json:"counts"`
	Total     int      `json:"total"`
}
