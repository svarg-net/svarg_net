package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"svarg_net/internal/model"
)

// LessonRepository интерфейс для работы с уроками
type LessonRepository interface {
	ListByCourseID(ctx context.Context, courseID int64) ([]model.Lesson, error)
	GetByID(ctx context.Context, id int64) (*model.Lesson, error)
	GetByCourseAndSlug(ctx context.Context, courseID int64, slug string) (*model.Lesson, error)
	Create(ctx context.Context, data model.LessonCreateData) (*model.Lesson, error)
	Update(ctx context.Context, id int64, upd model.LessonUpdateData) (*model.Lesson, error)
	Delete(ctx context.Context, id int64) error
	Reorder(ctx context.Context, courseID int64, lessonIDs []int64) error
}

type lessonRepository struct {
	pool *pgxpool.Pool
}

// NewLessonRepository создаёт репозиторий уроков
func NewLessonRepository(pool *pgxpool.Pool) LessonRepository {
	return &lessonRepository{pool: pool}
}

const lessonColumns = `id, course_id, title, slug, position, is_free, min_score, created_at, updated_at`

func scanLesson(row pgx.Row) (*model.Lesson, error) {
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
		return nil, fmt.Errorf("failed to scan lesson: %w", err)
	}
	return &l, nil
}

func scanLessons(rows pgx.Rows) ([]model.Lesson, error) {
	defer rows.Close()
	lessons := []model.Lesson{}
	for rows.Next() {
		l, err := scanLesson(rows)
		if err != nil {
			return nil, err
		}
		if l != nil {
			lessons = append(lessons, *l)
		}
	}
	return lessons, nil
}

func (r *lessonRepository) ListByCourseID(ctx context.Context, courseID int64) ([]model.Lesson, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT `+lessonColumns+` FROM lessons
		WHERE course_id = $1
		ORDER BY position, id`, courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to list lessons: %w", err)
	}
	lessons, err := scanLessons(rows)
	if err != nil {
		return nil, err
	}

	// Добавляем block_count
	for i := range lessons {
		var count int
		err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM lesson_blocks WHERE lesson_id = $1`, lessons[i].ID).Scan(&count)
		if err == nil {
			lessons[i].BlockCount = count
		}
	}
	return lessons, nil
}

func (r *lessonRepository) GetByID(ctx context.Context, id int64) (*model.Lesson, error) {
	l, err := scanLesson(r.pool.QueryRow(ctx,
		`SELECT `+lessonColumns+` FROM lessons WHERE id = $1`, id))
	if err != nil {
		return nil, err
	}
	if l == nil {
		return nil, fmt.Errorf("lesson not found")
	}

	var count int
	err = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM lesson_blocks WHERE lesson_id = $1`, l.ID).Scan(&count)
	if err == nil {
		l.BlockCount = count
	}
	return l, nil
}

func (r *lessonRepository) GetByCourseAndSlug(ctx context.Context, courseID int64, slug string) (*model.Lesson, error) {
	l, err := scanLesson(r.pool.QueryRow(ctx,
		`SELECT `+lessonColumns+` FROM lessons WHERE course_id = $1 AND slug = $2`,
		courseID, slug))
	if err != nil {
		return nil, err
	}
	if l == nil {
		return nil, fmt.Errorf("lesson not found")
	}

	var count int
	err = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM lesson_blocks WHERE lesson_id = $1`, l.ID).Scan(&count)
	if err == nil {
		l.BlockCount = count
	}
	return l, nil
}

func (r *lessonRepository) Create(ctx context.Context, data model.LessonCreateData) (*model.Lesson, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	position := 0
	if data.Position != nil {
		position = *data.Position
		if _, err := tx.Exec(ctx, `
			UPDATE lessons SET position = position + 1
			WHERE course_id = $1 AND position >= $2`, data.CourseID, position); err != nil {
			return nil, fmt.Errorf("failed to shift lessons: %w", err)
		}
	} else {
		if err := tx.QueryRow(ctx, `
			SELECT COALESCE(MAX(position), -1) + 1 FROM lessons WHERE course_id = $1`,
			data.CourseID).Scan(&position); err != nil {
			return nil, fmt.Errorf("failed to get next position: %w", err)
		}
	}

	isFree := false
	if data.IsFree != nil {
		isFree = *data.IsFree
	}
	minScore := 0
	if data.MinScore != nil {
		minScore = *data.MinScore
	}

	l, err := scanLesson(tx.QueryRow(ctx, `
		INSERT INTO lessons (course_id, title, slug, position, is_free, min_score)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING `+lessonColumns,
		data.CourseID, data.Title, data.Slug, position, isFree, minScore))
	if err != nil {
		return nil, fmt.Errorf("failed to create lesson: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit: %w", err)
	}
	return l, nil
}

func (r *lessonRepository) Update(ctx context.Context, id int64, upd model.LessonUpdateData) (*model.Lesson, error) {
	l, err := scanLesson(r.pool.QueryRow(ctx, `
		UPDATE lessons SET
			title = COALESCE($1, title),
			slug = COALESCE($2, slug),
			position = COALESCE($3, position),
			is_free = COALESCE($4, is_free),
			min_score = COALESCE($5, min_score),
			updated_at = now()
		WHERE id = $6
		RETURNING `+lessonColumns,
		upd.Title, upd.Slug, upd.Position, upd.IsFree, upd.MinScore, id))
	if err != nil {
		return nil, fmt.Errorf("failed to update lesson: %w", err)
	}
	if l == nil {
		return nil, fmt.Errorf("lesson not found")
	}

	var count int
	err = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM lesson_blocks WHERE lesson_id = $1`, l.ID).Scan(&count)
	if err == nil {
		l.BlockCount = count
	}
	return l, nil
}

func (r *lessonRepository) Delete(ctx context.Context, id int64) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var courseID int64
	err = tx.QueryRow(ctx, `DELETE FROM lessons WHERE id = $1 RETURNING course_id`, id).Scan(&courseID)
	if err == pgx.ErrNoRows {
		return nil
	}
	if err != nil {
		return fmt.Errorf("failed to delete lesson: %w", err)
	}

	// Перенумеровываем оставшиеся уроки
	if _, err := tx.Exec(ctx, `
		WITH ordered AS (
			SELECT id, ROW_NUMBER() OVER (ORDER BY position, id) - 1 AS new_pos
			FROM lessons
			WHERE course_id = $1
		)
		UPDATE lessons l SET position = o.new_pos
		FROM ordered o
		WHERE l.id = o.id`, courseID); err != nil {
		return fmt.Errorf("failed to renumber lessons: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit: %w", err)
	}
	return nil
}

func (r *lessonRepository) Reorder(ctx context.Context, courseID int64, lessonIDs []int64) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var count int
	if err := tx.QueryRow(ctx, `
		SELECT COUNT(*) FROM lessons WHERE course_id = $1 AND id = ANY($2)`,
		courseID, lessonIDs).Scan(&count); err != nil {
		return fmt.Errorf("failed to check lesson ownership: %w", err)
	}
	if count != len(lessonIDs) {
		return fmt.Errorf("some lessons do not belong to course %d", courseID)
	}

	for i, id := range lessonIDs {
		if _, err := tx.Exec(ctx, `
			UPDATE lessons SET position = 1000000 + $1, updated_at = now() WHERE id = $2`,
			i, id); err != nil {
			return fmt.Errorf("failed to set temp position: %w", err)
		}
	}

	for i, id := range lessonIDs {
		if _, err := tx.Exec(ctx, `
			UPDATE lessons SET position = $1, updated_at = now() WHERE id = $2`,
			i, id); err != nil {
			return fmt.Errorf("failed to set final position: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit: %w", err)
	}
	return nil
}
