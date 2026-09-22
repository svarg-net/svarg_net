package service

import (
	"context"
	"fmt"

	"svarg_net/internal/logger"
	"svarg_net/internal/model"
	"svarg_net/internal/repository"
)

// EnrollmentService бизнес-логика записей на курсы
type EnrollmentService interface {
	// Enroll записывает студента на курс по slug
	Enroll(ctx context.Context, userID int64, courseSlug string) (*model.Enrollment, error)
	// IsEnrolled проверяет, записан ли студент на курс
	IsEnrolled(ctx context.Context, userID, courseID int64) (bool, error)
	// ListMyEnrollments возвращает список записей студента с курсами
	ListMyEnrollments(ctx context.Context, userID int64) ([]model.Enrollment, error)
	// CountEnrollments считает число студентов курса
	CountEnrollments(ctx context.Context, courseID int64) (int, error)
}

type enrollmentService struct {
	enrollmentRepo repository.EnrollmentRepository
	courseRepo     repository.CourseRepository
	log            logger.Logger
}

// NewEnrollmentService создаёт сервис записей
func NewEnrollmentService(
	enrollmentRepo repository.EnrollmentRepository,
	courseRepo repository.CourseRepository,
	log logger.Logger,
) EnrollmentService {
	return &enrollmentService{
		enrollmentRepo: enrollmentRepo,
		courseRepo:     courseRepo,
		log:            log,
	}
}

func (s *enrollmentService) Enroll(ctx context.Context, userID int64, courseSlug string) (*model.Enrollment, error) {
	course, err := s.courseRepo.GetBySlug(ctx, courseSlug)
	if err != nil {
		return nil, fmt.Errorf("course not found")
	}
	if course.Status != model.CourseStatusPublished {
		return nil, fmt.Errorf("course is not published")
	}

	enrollment, err := s.enrollmentRepo.Enroll(ctx, userID, course.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to enroll: %w", err)
	}

	s.log.Info("student enrolled", "user_id", userID, "course_id", course.ID, "slug", courseSlug)
	return enrollment, nil
}

func (s *enrollmentService) IsEnrolled(ctx context.Context, userID, courseID int64) (bool, error) {
	return s.enrollmentRepo.IsEnrolled(ctx, userID, courseID)
}

func (s *enrollmentService) ListMyEnrollments(ctx context.Context, userID int64) ([]model.Enrollment, error) {
	return s.enrollmentRepo.ListByUser(ctx, userID)
}

func (s *enrollmentService) CountEnrollments(ctx context.Context, courseID int64) (int, error) {
	return s.enrollmentRepo.CountByCourse(ctx, courseID)
}
