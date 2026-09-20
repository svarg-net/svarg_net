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

// CourseService бизнес-логика курсов
type CourseService interface {
	List(ctx context.Context, status string) ([]model.Course, error)
	GetByID(ctx context.Context, id int64) (*model.Course, error)
	GetBySlug(ctx context.Context, slug string) (*model.Course, error)
	Create(ctx context.Context, data model.CourseCreateData) (*model.Course, error)
	Update(ctx context.Context, id int64, upd model.CourseUpdateData) (*model.Course, error)
	Delete(ctx context.Context, id int64) error
}

type courseService struct {
	courseRepo repository.CourseRepository
	log        logger.Logger
}

// NewCourseService создаёт сервис курсов
func NewCourseService(
	courseRepo repository.CourseRepository,
	log logger.Logger,
) CourseService {
	return &courseService{courseRepo: courseRepo, log: log}
}

var slugRegex = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

func (s *courseService) validateSlug(slug string) error {
	if slug == "" {
		return fmt.Errorf("slug is required")
	}
	if len(slug) > 255 {
		return fmt.Errorf("slug too long")
	}
	if !slugRegex.MatchString(slug) {
		return fmt.Errorf("slug must be lowercase alphanumeric with hyphens")
	}
	return nil
}

func (s *courseService) List(ctx context.Context, status string) ([]model.Course, error) {
	return s.courseRepo.List(ctx, status)
}

func (s *courseService) GetByID(ctx context.Context, id int64) (*model.Course, error) {
	return s.courseRepo.GetByID(ctx, id)
}

func (s *courseService) GetBySlug(ctx context.Context, slug string) (*model.Course, error) {
	if err := s.validateSlug(slug); err != nil {
		return nil, err
	}
	return s.courseRepo.GetBySlug(ctx, slug)
}

func (s *courseService) Create(ctx context.Context, data model.CourseCreateData) (*model.Course, error) {
	data.Title = strings.TrimSpace(data.Title)
	if data.Title == "" {
		return nil, fmt.Errorf("title is required")
	}

	data.Slug = strings.TrimSpace(strings.ToLower(data.Slug))
	if err := s.validateSlug(data.Slug); err != nil {
		return nil, err
	}

	course, err := s.courseRepo.Create(ctx, data)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			return nil, fmt.Errorf("course with slug %q already exists", data.Slug)
		}
		return nil, err
	}

	s.log.Info("course created", "id", course.ID, "slug", course.Slug)
	return course, nil
}

func (s *courseService) Update(ctx context.Context, id int64, upd model.CourseUpdateData) (*model.Course, error) {
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

	course, err := s.courseRepo.Update(ctx, id, upd)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			return nil, fmt.Errorf("slug already in use")
		}
		return nil, err
	}

	s.log.Info("course updated", "id", course.ID)
	return course, nil
}

func (s *courseService) Delete(ctx context.Context, id int64) error {
	if err := s.courseRepo.Delete(ctx, id); err != nil {
		return err
	}
	s.log.Info("course deleted", "id", id)
	return nil
}
