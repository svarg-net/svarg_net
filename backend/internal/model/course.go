package model

import "time"

// Статусы курса
const (
	CourseStatusDraft     = "draft"
	CourseStatusPublished = "published"
)

// Уровни курса
const (
	CourseLevelBeginner     = "beginner"
	CourseLevelIntermediate = "intermediate"
	CourseLevelAdvanced     = "advanced"
)

// Course модель курса
type Course struct {
	ID          int64     `json:"id"`
	Title       string    `json:"title"`
	Slug        string    `json:"slug"`
	Description string    `json:"description"`
	CoverURL    *string   `json:"cover_url,omitempty"`
	Status      string    `json:"status"`
	Level       string    `json:"level"`
	Position    int       `json:"position"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	LessonCount int       `json:"lesson_count,omitempty"`
}

// Lesson модель урока
type Lesson struct {
	ID         int64     `json:"id"`
	CourseID   int64     `json:"course_id"`
	Title      string    `json:"title"`
	Slug       string    `json:"slug"`
	Position   int       `json:"position"`
	IsFree     bool      `json:"is_free"`
	MinScore   int       `json:"min_score"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
	BlockCount int       `json:"block_count,omitempty"`
}

// CourseCreateData данные создания курса
type CourseCreateData struct {
	Title       string  `json:"title"`
	Slug        string  `json:"slug"`
	Description *string `json:"description,omitempty"`
	CoverURL    *string `json:"cover_url,omitempty"`
	Status      *string `json:"status,omitempty"`
	Level       *string `json:"level,omitempty"`
	Position    *int    `json:"position,omitempty"`
}

// CourseUpdateData данные обновления курса
type CourseUpdateData struct {
	Title       *string `json:"title,omitempty"`
	Slug        *string `json:"slug,omitempty"`
	Description *string `json:"description,omitempty"`
	CoverURL    *string `json:"cover_url,omitempty"`
	Status      *string `json:"status,omitempty"`
	Level       *string `json:"level,omitempty"`
	Position    *int    `json:"position,omitempty"`
}

// LessonCreateData данные создания урока
type LessonCreateData struct {
	CourseID int64   `json:"course_id"`
	Title    string  `json:"title"`
	Slug     string  `json:"slug"`
	Position *int    `json:"position,omitempty"`
	IsFree   *bool   `json:"is_free,omitempty"`
	MinScore *int    `json:"min_score,omitempty"`
}

// LessonUpdateData данные обновления урока
type LessonUpdateData struct {
	Title    *string `json:"title,omitempty"`
	Slug     *string `json:"slug,omitempty"`
	Position *int    `json:"position,omitempty"`
	IsFree   *bool   `json:"is_free,omitempty"`
	MinScore *int    `json:"min_score,omitempty"`
}

// CourseListResponse список курсов
type CourseListResponse struct {
	Items []Course `json:"items"`
	Total int      `json:"total"`
}

// LessonListResponse список уроков
type LessonListResponse struct {
	Items []Lesson `json:"items"`
	Total int      `json:"total"`
}
