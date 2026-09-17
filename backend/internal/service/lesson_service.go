package service

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"svarg_net/internal/logger"
	"svarg_net/internal/model"
	"svarg_net/internal/repository"
)

// LessonService бизнес-логика уроков
type LessonService interface {
	ListByCourseID(ctx context.Context, courseID int64) ([]model.Lesson, error)
	GetByID(ctx context.Context, id int64) (*model.Lesson, error)
	GetByCourseAndSlug(ctx context.Context, courseID int64, slug string) (*model.Lesson, error)
	Create(ctx context.Context, data model.LessonCreateData) (*model.Lesson, error)
	Update(ctx context.Context, id int64, upd model.LessonUpdateData) (*model.Lesson, error)
	Delete(ctx context.Context, id int64) error
	Reorder(ctx context.Context, courseID int64, lessonIDs []int64) error
}

type lessonService struct {
	lessonRepo repository.LessonRepository
	courseRepo repository.CourseRepository
	log        logger.Logger
}

// NewLessonService создаёт сервис уроков
func NewLessonService(
	lessonRepo repository.LessonRepository,
	courseRepo repository.CourseRepository,
	log logger.Logger,
) LessonService {
	return &lessonService{
		lessonRepo: lessonRepo,
		courseRepo: courseRepo,
		log:        log,
	}
}

var lessonSlugRegex = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

func (s *lessonService) validateSlug(slug string) error {
	if slug == "" {
		return fmt.Errorf("slug is required")
	}
	if len(slug) > 255 {
		return fmt.Errorf("slug too long")
	}
	if !lessonSlugRegex.MatchString(slug) {
		return fmt.Errorf("slug must be lowercase alphanumeric with hyphens")
	}
	return nil
}

func (s *lessonService) ListByCourseID(ctx context.Context, courseID int64) ([]model.Lesson, error) {
	return s.lessonRepo.ListByCourseID(ctx, courseID)
}

func (s *lessonService) GetByID(ctx context.Context, id int64) (*model.Lesson, error) {
	return s.lessonRepo.GetByID(ctx, id)
}

func (s *lessonService) GetByCourseAndSlug(ctx context.Context, courseID int64, slug string) (*model.Lesson, error) {
	if err := s.validateSlug(slug); err != nil {
		return nil, err
	}
	return s.lessonRepo.GetByCourseAndSlug(ctx, courseID, slug)
}

func (s *lessonService) Create(ctx context.Context, data model.LessonCreateData) (*model.Lesson, error) {
	if data.CourseID == 0 {
		return nil, fmt.Errorf("course_id is required")
	}

	// Проверяем, что курс существует
	_, err := s.courseRepo.GetByID(ctx, data.CourseID)
	if err != nil {
		return nil, fmt.Errorf("course not found")
	}

	data.Title = strings.TrimSpace(data.Title)
	if data.Title == "" {
		return nil, fmt.Errorf("title is required")
	}

	data.Slug = strings.TrimSpace(strings.ToLower(data.Slug))
	if err := s.validateSlug(data.Slug); err != nil {
		return nil, err
	}

	lesson, err := s.lessonRepo.Create(ctx, data)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			return nil, fmt.Errorf("lesson with slug %q already exists in course", data.Slug)
		}
		return nil, err
	}

	s.log.Info("lesson created", "id", lesson.ID, "course_id", lesson.CourseID)
	return lesson, nil
}

func (s *lessonService) Update(ctx context.Context, id int64, upd model.LessonUpdateData) (*model.Lesson, error) {
	if upd.Title != nil {
		title := strings.TrimSpace(*upd.Title)
		if title == "" {
			return nil, fmt.Errorf("title cannot be empty")
		}
		upd.Title = &title
	}

	if upd.Slug != nil {
		slug := strings.TrimSpace(strings.ToLower(*upd.Slug))
		if err := s.validateSlug(slug); err != nil {
			return nil, err
		}
		upd.Slug = &slug
	}

	lesson, err := s.lessonRepo.Update(ctx, id, upd)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			return nil, fmt.Errorf("slug already in use")
		}
		return nil, err
	}

	s.log.Info("lesson updated", "id", lesson.ID)
	return lesson, nil
}

func (s *lessonService) Delete(ctx context.Context, id int64) error {
	if err := s.lessonRepo.Delete(ctx, id); err != nil {
		return err
	}
	s.log.Info("lesson deleted", "id", id)
	return nil
}

func (s *lessonService) Reorder(ctx context.Context, courseID int64, lessonIDs []int64) error {
	if len(lessonIDs) == 0 {
		return nil
	}
	if err := s.lessonRepo.Reorder(ctx, courseID, lessonIDs); err != nil {
		return err
	}
	s.log.Info("lessons reordered", "course_id", courseID, "count", len(lessonIDs))
	return nil
}
