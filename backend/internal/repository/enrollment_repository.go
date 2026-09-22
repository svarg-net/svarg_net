package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"svarg_net/internal/model"
)

// EnrollmentRepository операции с записями на курс
type EnrollmentRepository interface {
	// Enroll записывает студента на курс. Идемпотентно.
	Enroll(ctx context.Context, userID, courseID int64) (*model.Enrollment, error)
	// IsEnrolled проверяет, записан ли студент
	IsEnrolled(ctx context.Context, userID, courseID int64) (bool, error)
	// ListByUser возвращает список записей с полными курсами
	ListByUser(ctx context.Context, userID int64) ([]model.Enrollment, error)
	// CountByCourse считает число студентов курса
	CountByCourse(ctx context.Context, courseID int64) (int, error)
}

type enrollmentRepository struct {
	pool *pgxpool.Pool
}

// NewEnrollmentRepository создаёт репозиторий записей
func NewEnrollmentRepository(pool *pgxpool.Pool) EnrollmentRepository {
	return &enrollmentRepository{pool: pool}
}

const enrollmentColumns = "e.id, e.user_id, e.course_id, e.enrolled_at"

func scanEnrollment(row pgx.Row, course *model.Course) (*model.Enrollment, error) {
	var e model.Enrollment
	e.Course = course
	err := row.Scan(
		&e.ID, &e.UserID, &e.CourseID, &e.EnrolledAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to scan enrollment: %w", err)
	}
	return &e, nil
}

func (r *enrollmentRepository) Enroll(ctx context.Context, userID, courseID int64) (*model.Enrollment, error) {
	e := &model.Enrollment{}
	err := r.pool.QueryRow(ctx, `
		INSERT INTO enrollments (user_id, course_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, course_id) DO NOTHING
		RETURNING id, user_id, course_id, enrolled_at`,
		userID, courseID,
	).Scan(&e.ID, &e.UserID, &e.CourseID, &e.EnrolledAt)

	if err == pgx.ErrNoRows {
		// Уже была запись — читаем существующую
		err = r.pool.QueryRow(ctx, `
			SELECT id, user_id, course_id, enrolled_at
			FROM enrollments
			WHERE user_id = $1 AND course_id = $2`,
			userID, courseID,
		).Scan(&e.ID, &e.UserID, &e.CourseID, &e.EnrolledAt)
		if err != nil {
			return nil, fmt.Errorf("failed to get existing enrollment: %w", err)
		}
	} else if err != nil {
		return nil, fmt.Errorf("failed to enroll: %w", err)
	}

	// Подтягиваем курс
	course, err := (&courseRepository{pool: r.pool}).GetByID(ctx, courseID)
	if err == nil {
		e.Course = course
	}

	return e, nil
}

func (r *enrollmentRepository) IsEnrolled(ctx context.Context, userID, courseID int64) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2)`,
		userID, courseID,
	).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check enrollment: %w", err)
	}
	return exists, nil
}

func (r *enrollmentRepository) ListByUser(ctx context.Context, userID int64) ([]model.Enrollment, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT e.id, e.user_id, e.course_id, e.enrolled_at
		FROM enrollments e
		WHERE e.user_id = $1
		ORDER BY e.enrolled_at DESC`,
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to list enrollments: %w", err)
	}
	defer rows.Close()

	var result []model.Enrollment
	courseRepo := &courseRepository{pool: r.pool}
	for rows.Next() {
		var e model.Enrollment
		if err := rows.Scan(&e.ID, &e.UserID, &e.CourseID, &e.EnrolledAt); err != nil {
			return nil, fmt.Errorf("failed to scan enrollment row: %w", err)
		}
		if course, err := courseRepo.GetByID(ctx, e.CourseID); err == nil {
			e.Course = course
		}
		result = append(result, e)
	}
	return result, nil
}

func (r *enrollmentRepository) CountByCourse(ctx context.Context, courseID int64) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM enrollments WHERE course_id = $1`,
		courseID,
	).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count enrollments: %w", err)
	}
	return count, nil
}
