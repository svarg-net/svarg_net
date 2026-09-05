package model

import "time"

// PopularPost пост в блоке «Популярное»
type PopularPost struct {
	ID    int64  `json:"id"`
	Title string `json:"title"`
	Slug  string `json:"slug"`
	Views int64  `json:"views"`
}

// PostStats статистика поста для админки
type PostStats struct {
	ID         int64      `json:"id"`
	Title      string     `json:"title"`
	Slug       string     `json:"slug"`
	Views      int64      `json:"views"`
	Unique     int64      `json:"unique"`
	LastViewAt *time.Time `json:"last_view_at,omitempty"`
}

// DailyStats просмотры за день
type DailyStats struct {
	Date   string `json:"date"`
	Views  int64  `json:"views"`
	Unique int64  `json:"unique"`
}

// StatsSummary сводка по сайту
type StatsSummary struct {
	TotalViews  int64 `json:"total_views"`
	TotalUnique int64 `json:"total_unique"`
	ViewsToday  int64 `json:"views_today"`
	UniqueToday int64 `json:"unique_today"`
}

// AdminStats полный ответ статистики для админки
type AdminStats struct {
	Summary StatsSummary `json:"summary"`
	Posts   []PostStats  `json:"posts"`
	Daily   []DailyStats `json:"daily"`
}
