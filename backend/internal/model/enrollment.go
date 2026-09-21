package model

import "time"

// Enrollment запись студента на курс
type Enrollment struct {
	ID         int64     `json:"id"`
	UserID     int64     `json:"user_id"`
	CourseID   int64     `json:"course_id"`
	EnrolledAt time.Time `json:"enrolled_at"`
	Course     *Course   `json:"course,omitempty"`
}

// LessonProgress прогресс студента по уроку
type LessonProgress struct {
	ID          int64      `json:"id"`
	UserID      int64      `json:"user_id"`
	LessonID    int64      `json:"lesson_id"`
	QuizScore   *int       `json:"quiz_score"`
	CompletedAt *time.Time `json:"completed_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// EnrollmentListResponse список записей с курсами
type EnrollmentListResponse struct {
	Items []Enrollment `json:"items"`
	Total int          `json:"total"`
}

// CourseProgressSummary сводка прогресса по курсу
type CourseProgressSummary struct {
	CourseID       int64   `json:"course_id"`
	CourseTitle    string  `json:"course_title"`
	CourseSlug     string  `json:"course_slug"`
	TotalLessons   int     `json:"total_lessons"`
	CompletedCount int     `json:"completed_count"`
	Percent        int     `json:"percent"`
	LastLessonSlug string  `json:"last_lesson_slug,omitempty"`
	LastLessonTitle string `json:"last_lesson_title,omitempty"`
}
