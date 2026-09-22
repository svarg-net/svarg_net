package service

import (
	"context"
	"fmt"

	"svarg_net/internal/logger"
	"svarg_net/internal/model"
	"svarg_net/internal/repository"
)

// ProgressService бизнес-логика прогресса по урокам
type ProgressService interface {
	// MarkComplete отмечает урок завершённым (проверка: записан на курс)
	MarkComplete(ctx context.Context, userID, lessonID int64) (*model.LessonProgress, error)
	// SubmitQuiz принимает результат теста (score >= min_score → completed)
	SubmitQuiz(ctx context.Context, userID, lessonID int64, score int) (*model.LessonProgress, error)
	// GetCourseProgress возвращает сводку прогресса по курсу
	GetCourseProgress(ctx context.Context, userID, courseID int64) (*model.CourseProgressSummary, error)
	// GetLessonProgress возвращает прогресс студента по уроку
	GetLessonProgress(ctx context.Context, userID, lessonID int64) (*model.LessonProgress, error)
	// GetMyLessonsProgress прогресс студента по всем урокам курса
	GetMyLessonsProgress(ctx context.Context, userID, courseID int64) ([]model.LessonProgress, error)
	// CanAccessLesson проверяет, есть ли у студента доступ к уроку
	CanAccessLesson(ctx context.Context, userID, lessonID int64) (bool, error)
}

type progressService struct {
	progressRepo   repository.ProgressRepository
	enrollmentRepo repository.EnrollmentRepository
	lessonRepo     repository.LessonRepository
	courseRepo     repository.CourseRepository
	log            logger.Logger
}

// NewProgressService создаёт сервис прогресса
func NewProgressService(
	progressRepo repository.ProgressRepository,
	enrollmentRepo repository.EnrollmentRepository,
	lessonRepo repository.LessonRepository,
	courseRepo repository.CourseRepository,
	log logger.Logger,
) ProgressService {
	return &progressService{
		progressRepo:   progressRepo,
		enrollmentRepo: enrollmentRepo,
		lessonRepo:     lessonRepo,
		courseRepo:     courseRepo,
		log:            log,
	}
}

func (s *progressService) MarkComplete(ctx context.Context, userID, lessonID int64) (*model.LessonProgress, error) {
	lesson, err := s.lessonRepo.GetByID(ctx, lessonID)
	if err != nil {
		return nil, fmt.Errorf("lesson not found")
	}

	// Проверка: студент записан на курс?
	enrolled, err := s.enrollmentRepo.IsEnrolled(ctx, userID, lesson.CourseID)
	if err != nil {
		return nil, fmt.Errorf("failed to check enrollment: %w", err)
	}
	if !enrolled {
		return nil, fmt.Errorf("not enrolled in course")
	}

	progress, err := s.progressRepo.Upsert(ctx, userID, lessonID, nil, true)
	if err != nil {
		return nil, fmt.Errorf("failed to mark complete: %w", err)
	}

	s.log.Info("lesson completed", "user_id", userID, "lesson_id", lessonID)
	return progress, nil
}

func (s *progressService) SubmitQuiz(ctx context.Context, userID, lessonID int64, score int) (*model.LessonProgress, error) {
	lesson, err := s.lessonRepo.GetByID(ctx, lessonID)
	if err != nil {
		return nil, fmt.Errorf("lesson not found")
	}

	// Проверка: студент записан на курс?
	enrolled, err := s.enrollmentRepo.IsEnrolled(ctx, userID, lesson.CourseID)
	if err != nil {
		return nil, fmt.Errorf("failed to check enrollment: %w", err)
	}
	if !enrolled {
		return nil, fmt.Errorf("not enrolled in course")
	}

	// Проверяем, пройден ли порог
	completed := score >= lesson.MinScore

	progress, err := s.progressRepo.Upsert(ctx, userID, lessonID, &score, completed)
	if err != nil {
		return nil, fmt.Errorf("failed to submit quiz: %w", err)
	}

	s.log.Info("quiz submitted", "user_id", userID, "lesson_id", lessonID, "score", score, "completed", completed)
	return progress, nil
}

func (s *progressService) GetCourseProgress(ctx context.Context, userID, courseID int64) (*model.CourseProgressSummary, error) {
	course, err := s.courseRepo.GetByID(ctx, courseID)
	if err != nil {
		return nil, fmt.Errorf("course not found")
	}

	lessons, err := s.lessonRepo.ListByCourseID(ctx, courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to list lessons: %w", err)
	}

	totalLessons := len(lessons)
	if totalLessons == 0 {
		return &model.CourseProgressSummary{
			CourseID:     courseID,
			CourseTitle:  course.Title,
			CourseSlug:   course.Slug,
			TotalLessons: 0,
			Percent:      0,
		}, nil
	}

	completedCount, err := s.progressRepo.CountCompleted(ctx, userID, courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to count completed: %w", err)
	}

	percent := int(float64(completedCount) / float64(totalLessons) * 100)

	summary := &model.CourseProgressSummary{
		CourseID:       courseID,
		CourseTitle:    course.Title,
		CourseSlug:     course.Slug,
		TotalLessons:   totalLessons,
		CompletedCount: completedCount,
		Percent:        percent,
	}

	// Находим последний завершённый урок для "продолжить"
	if lastLesson, err := s.progressRepo.GetLastCompleted(ctx, userID, courseID); err == nil && lastLesson != nil {
		summary.LastLessonSlug = lastLesson.Slug
		summary.LastLessonTitle = lastLesson.Title
	}

	return summary, nil
}

func (s *progressService) GetLessonProgress(ctx context.Context, userID, lessonID int64) (*model.LessonProgress, error) {
	return s.progressRepo.GetByUserAndLesson(ctx, userID, lessonID)
}

func (s *progressService) GetMyLessonsProgress(ctx context.Context, userID, courseID int64) ([]model.LessonProgress, error) {
	return s.progressRepo.ListByUserAndCourse(ctx, userID, courseID)
}

func (s *progressService) CanAccessLesson(ctx context.Context, userID, lessonID int64) (bool, error) {
	lesson, err := s.lessonRepo.GetByID(ctx, lessonID)
	if err != nil {
		return false, fmt.Errorf("lesson not found")
	}

	// Бесплатные уроки доступны всем
	if lesson.IsFree {
		return true, nil
	}

	// Платные — только записанным
	return s.enrollmentRepo.IsEnrolled(ctx, userID, lesson.CourseID)
}
