package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"svarg_net/internal/logger"
	"svarg_net/internal/model"
	"svarg_net/internal/repository"
)

var ErrEnrollmentRequired = errors.New("enrollment required")

// LessonBlockService бизнес-логика блоков уроков
type LessonBlockService interface {
	ListPublic(ctx context.Context, lessonID int64) ([]model.Block, error)
	ListPublicWithAccess(ctx context.Context, lessonID int64, userID int64) ([]model.Block, error)
	ListForAdmin(ctx context.Context, lessonID int64) ([]model.Block, error)
	Create(ctx context.Context, data model.BlockCreateData) (*model.Block, error)
	Update(ctx context.Context, id int64, upd model.BlockUpdateData) (*model.Block, error)
	Delete(ctx context.Context, id int64) error
	Reorder(ctx context.Context, lessonID int64, blockIDs []int64) error
}

type lessonBlockService struct {
	blockRepo      repository.BlockRepository
	lessonRepo     repository.LessonRepository
	enrollmentRepo repository.EnrollmentRepository
	log            logger.Logger
}

// NewLessonBlockService создаёт сервис блоков уроков
func NewLessonBlockService(
	blockRepo repository.BlockRepository,
	lessonRepo repository.LessonRepository,
	enrollmentRepo repository.EnrollmentRepository,
	log logger.Logger,
) LessonBlockService {
	return &lessonBlockService{
		blockRepo:      blockRepo,
		lessonRepo:     lessonRepo,
		enrollmentRepo: enrollmentRepo,
		log:            log,
	}
}

// ListPublicWithAccess — блоки урока с проверкой доступа (userID=0 → только is_free)
func (s *lessonBlockService) ListPublic(ctx context.Context, lessonID int64) ([]model.Block, error) {
	return s.ListPublicWithAccess(ctx, lessonID, 0)
}

func (s *lessonBlockService) ListPublicWithAccess(ctx context.Context, lessonID int64, userID int64) ([]model.Block, error) {
	lesson, err := s.lessonRepo.GetByID(ctx, lessonID)
	if err != nil {
		return nil, err
	}
	if lesson == nil {
		return nil, errors.New("lesson not found")
	}

	// Если урок платный — проверяем запись
	if !lesson.IsFree {
		if userID == 0 {
			return nil, ErrEnrollmentRequired
		}
		enrolled, err := s.enrollmentRepo.IsEnrolled(ctx, userID, lesson.CourseID)
		if err != nil {
			return nil, err
		}
		if !enrolled {
			return nil, ErrEnrollmentRequired
		}
	}

	return s.blockRepo.ListByPostID(ctx, lessonID)
}

// ListForAdmin — все блоки урока для редактора
func (s *lessonBlockService) ListForAdmin(ctx context.Context, lessonID int64) ([]model.Block, error) {
	return s.blockRepo.ListByPostID(ctx, lessonID)
}

func (s *lessonBlockService) Create(ctx context.Context, data model.BlockCreateData) (*model.Block, error) {
	if !model.AllowedBlockTypes[data.Type] {
		return nil, fmt.Errorf("unknown block type: %s", data.Type)
	}
	if len(data.Data) == 0 {
		data.Data = json.RawMessage("{}")
	}
	if !json.Valid(data.Data) {
		return nil, errors.New("invalid block data JSON")
	}

	block, err := s.blockRepo.Create(ctx, data)
	if err != nil {
		return nil, err
	}

	s.log.Info("lesson block created", "block_id", block.ID, "lesson_id", data.PostID, "type", data.Type)
	return block, nil
}

func (s *lessonBlockService) Update(ctx context.Context, id int64, upd model.BlockUpdateData) (*model.Block, error) {
	if upd.Type != nil && !model.AllowedBlockTypes[*upd.Type] {
		return nil, fmt.Errorf("unknown block type: %s", *upd.Type)
	}
	if upd.Data != nil && !json.Valid(*upd.Data) {
		return nil, errors.New("invalid block data JSON")
	}

	block, err := s.blockRepo.Update(ctx, id, upd)
	if err != nil {
		return nil, err
	}
	if block == nil {
		return nil, errors.New("block not found")
	}
	return block, nil
}

func (s *lessonBlockService) Delete(ctx context.Context, id int64) error {
	return s.blockRepo.Delete(ctx, id)
}

func (s *lessonBlockService) Reorder(ctx context.Context, lessonID int64, blockIDs []int64) error {
	if len(blockIDs) == 0 {
		return errors.New("empty block list")
	}
	return s.blockRepo.Reorder(ctx, lessonID, blockIDs)
}
