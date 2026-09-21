package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"svarg_net/internal/model"
)

// ProgressRepository операции с прогрессом по урокам
type ProgressRepository interface {
	// GetByUserAndLesson возвращает запись прогресса или nil
	GetByUserAndLesson(ctx context.Context, userID, lessonID int64) (*model.LessonProgress, error)
	// ListByUserAndCourse возвращает прогресс студента по всем урокам курса
	ListByUserAndCourse(ctx context.Context, userID, courseID int64) ([]model.LessonProgress, error)
	// Upsert обновляет или создаёт запись прогресса
	Upsert(ctx context.Context, userID, lessonID int64, quizScore *int, completed bool) (*model.LessonProgress, error)
	// CountCompleted считает завершённые уроки в курсе
	CountCompleted(ctx context.Context, userID, courseID int64) (int, error)
	// GetLastCompleted возвращает последний завершённый урок (для "продолжить")
	GetLastCompleted(ctx context.Context, userID, courseID int64) (*model.Lesson, error)
}

type progressRepository struct {
	pool *pgxpool.Pool
}

// NewProgressRepository создаёт репозиторий прогресса
func NewProgressRepository(pool *pgxpool.Pool) ProgressRepository {
	return &progressRepository{pool: pool}
}

const progressColumns = "id, user_id, lesson_id, quiz_score, completed_at, updated_at"

func scanProgress(row pgx.Row) (*model.LessonProgress, error) {
	var p model.LessonProgress
	err := row.Scan(
		&p.ID, &p.UserID, &p.LessonID, &p.QuizScore,
		&p.CompletedAt, &p.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to scan progress: %w", err)
	}
	return &p, nil
}

func (r *progressRepository) GetByUserAndLesson(ctx context.Context, userID, lessonID int64) (*model.LessonProgress, error) {
	return scanProgress(r.pool.QueryRow(ctx, `
		SELECT `+progressColumns+`
		FROM lesson_progress
		WHERE user_id = $1 AND lesson_id = $2`,
		userID, lessonID,
	))
}

func (r *progressRepository) ListByUserAndCourse(ctx context.Context, userID, courseID int64) ([]model.LessonProgress, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT p.`+progressColumns+`
		FROM lesson_progress p
		JOIN lessons l ON l.id = p.lesson_id
		WHERE p.user_id = $1 AND l.course_id = $2
		ORDER BY l.position, l.id`,
		userID, courseID,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to list progress: %w", err)
	}
	defer rows.Close()

	var result []model.LessonProgress
	for rows.Next() {
		var p model.LessonProgress
		if err := rows.Scan(&p.ID, &p.UserID, &p.LessonID, &p.QuizScore, &p.CompletedAt, &p.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan progress row: %w", err)
		}
		result = append(result, p)
	}
	return result, nil
}

func (r *progressRepository) Upsert(ctx context.Context, userID, lessonID int64, quizScore *int, completed bool) (*model.LessonProgress, error) {
	p := &model.LessonProgress{}

	var completedAt any
	if completed {
		completedAt = time.Now()
	}

	err := r.pool.QueryRow(ctx, `
		INSERT INTO lesson_progress (user_id, lesson_id, quiz_score, completed_at, updated_at)
		VALUES ($1, $2, $3, $4, now())
		ON CONFLICT (user_id, lesson_id) DO UPDATE SET
			quiz_score = COALESCE(EXCLUDED.quiz_score, lesson_progress.quiz_score),
			completed_at = COALESCE(EXCLUDED.completed_at, lesson_progress.completed_at),
			updated_at = now()
		RETURNING `+progressColumns,
		userID, lessonID, quizScore, completedAt,
	).Scan(&p.ID, &p.UserID, &p.LessonID, &p.QuizScore, &p.CompletedAt, &p.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to upsert progress: %w", err)
	}
	return p, nil
}

func (r *progressRepository) CountCompleted(ctx context.Context, userID, courseID int64) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `
		SELECT COUNT(*)
		FROM lesson_progress p
		JOIN lessons l ON l.id = p.lesson_id
		WHERE p.user_id = $1 AND l.course_id = $2 AND p.completed_at IS NOT NULL`,
		userID, courseID,
	).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count completed: %w", err)
	}
	return count, nil
}

func (r *progressRepository) GetLastCompleted(ctx context.Context, userID, courseID int64) (*model.Lesson, error) {
	// Последний завершённый урок (по времени завершения)
	row := r.pool.QueryRow(ctx, `
		SELECT l.id, l.course_id, l.title, l.slug, l.position, l.is_free, l.min_score, l.created_at, l.updated_at
		FROM lesson_progress p
		JOIN lessons l ON l.id = p.lesson_id
		WHERE p.user_id = $1 AND l.course_id = $2 AND p.completed_at IS NOT NULL
		ORDER BY p.completed_at DESC
		LIMIT 1`,
		userID, courseID,
	)

	var l model.Lesson
	err := row.Scan(
		&l.ID, &l.CourseID, &l.Title, &l.Slug,
		&l.Position, &l.IsFree, &l.MinScore,
		&l.CreatedAt, &l.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get last completed: %w", err)
	}
	return &l, nil
}
