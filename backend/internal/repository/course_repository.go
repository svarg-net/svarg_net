package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"svarg_net/internal/model"
)

// CourseRepository интерфейс для работы с курсами
type CourseRepository interface {
	List(ctx context.Context, status string) ([]model.Course, error)
	GetByID(ctx context.Context, id int64) (*model.Course, error)
	GetBySlug(ctx context.Context, slug string) (*model.Course, error)
	Create(ctx context.Context, data model.CourseCreateData) (*model.Course, error)
	Update(ctx context.Context, id int64, upd model.CourseUpdateData) (*model.Course, error)
	Delete(ctx context.Context, id int64) error
}

type courseRepository struct {
	pool *pgxpool.Pool
}

// NewCourseRepository создаёт репозиторий курсов
func NewCourseRepository(pool *pgxpool.Pool) CourseRepository {
	return &courseRepository{pool: pool}
}

const courseColumns = `id, title, slug, description, cover_url, status, level, position, created_at, updated_at`

func scanCourse(row pgx.Row) (*model.Course, error) {
	var c model.Course
	err := row.Scan(
		&c.ID, &c.Title, &c.Slug, &c.Description, &c.CoverURL,
		&c.Status, &c.Level, &c.Position, &c.CreatedAt, &c.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to scan course: %w", err)
	}
	return &c, nil
}

func scanCourses(rows pgx.Rows) ([]model.Course, error) {
	defer rows.Close()
	courses := []model.Course{}
	for rows.Next() {
		c, err := scanCourse(rows)
		if err != nil {
			return nil, err
		}
		if c != nil {
			courses = append(courses, *c)
		}
	}
	return courses, nil
}

func (r *courseRepository) List(ctx context.Context, status string) ([]model.Course, error) {
	query := `SELECT ` + courseColumns + ` FROM courses`
	var args []interface{}
	if status != "" {
		query += " WHERE status = $1"
		args = append(args, status)
	}
	query += " ORDER BY position, id"

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list courses: %w", err)
	}
	courses, err := scanCourses(rows)
	if err != nil {
		return nil, err
	}

	// Добавляем lesson_count для каждого курса
	for i := range courses {
		var count int
		err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM lessons WHERE course_id = $1`, courses[i].ID).Scan(&count)
		if err == nil {
			courses[i].LessonCount = count
		}
	}

	return courses, nil
}

func (r *courseRepository) GetByID(ctx context.Context, id int64) (*model.Course, error) {
	c, err := scanCourse(r.pool.QueryRow(ctx,
		`SELECT `+courseColumns+` FROM courses WHERE id = $1`, id))
	if err != nil {
		return nil, err
	}
	if c == nil {
		return nil, fmt.Errorf("course not found")
	}

	var count int
	err = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM lessons WHERE course_id = $1`, c.ID).Scan(&count)
	if err == nil {
		c.LessonCount = count
	}
	return c, nil
}

func (r *courseRepository) GetBySlug(ctx context.Context, slug string) (*model.Course, error) {
	c, err := scanCourse(r.pool.QueryRow(ctx,
		`SELECT `+courseColumns+` FROM courses WHERE slug = $1`, slug))
	if err != nil {
		return nil, err
	}
	if c == nil {
		return nil, fmt.Errorf("course not found")
	}

	var count int
	err = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM lessons WHERE course_id = $1`, c.ID).Scan(&count)
	if err == nil {
		c.LessonCount = count
	}
	return c, nil
}

func (r *courseRepository) Create(ctx context.Context, data model.CourseCreateData) (*model.Course, error) {
	status := model.CourseStatusDraft
	if data.Status != nil {
		status = *data.Status
	}
	level := model.CourseLevelBeginner
	if data.Level != nil {
		level = *data.Level
	}
	position := 0
	if data.Position != nil {
		position = *data.Position
	}

	c, err := scanCourse(r.pool.QueryRow(ctx, `
		INSERT INTO courses (title, slug, description, cover_url, status, level, position)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING `+courseColumns,
		data.Title, data.Slug, data.Description, data.CoverURL, status, level, position))
	if err != nil {
		return nil, fmt.Errorf("failed to create course: %w", err)
	}
	return c, nil
}

func (r *courseRepository) Update(ctx context.Context, id int64, upd model.CourseUpdateData) (*model.Course, error) {
	c, err := scanCourse(r.pool.QueryRow(ctx, `
		UPDATE courses SET
			title = COALESCE($1, title),
			slug = COALESCE($2, slug),
			description = COALESCE($3, description),
			cover_url = COALESCE($4, cover_url),
			status = COALESCE($5, status),
			level = COALESCE($6, level),
			position = COALESCE($7, position),
			updated_at = now()
		WHERE id = $8
		RETURNING `+courseColumns,
		upd.Title, upd.Slug, upd.Description, upd.CoverURL,
		upd.Status, upd.Level, upd.Position, id))
	if err != nil {
		return nil, fmt.Errorf("failed to update course: %w", err)
	}
	if c == nil {
		return nil, fmt.Errorf("course not found")
	}

	var count int
	err = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM lessons WHERE course_id = $1`, c.ID).Scan(&count)
	if err == nil {
		c.LessonCount = count
	}
	return c, nil
}

func (r *courseRepository) Delete(ctx context.Context, id int64) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM courses WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("failed to delete course: %w", err)
	}
	return nil
}
