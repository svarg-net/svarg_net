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

type BlockService interface {
	ListPublic(ctx context.Context, slug string) ([]model.Block, error)
	ListForAdmin(ctx context.Context, postID int64) ([]model.Block, error)
	Create(ctx context.Context, data model.BlockCreateData) (*model.Block, error)
	Update(ctx context.Context, id int64, upd model.BlockUpdateData) (*model.Block, error)
	Delete(ctx context.Context, id int64) error
	Reorder(ctx context.Context, postID int64, blockIDs []int64) error
	ConvertPostToBlocks(ctx context.Context, postID int64) error
}

type blockService struct {
	blockRepo repository.BlockRepository
	postRepo  repository.PostRepository
	log       logger.Logger
}

func NewBlockService(
	blockRepo repository.BlockRepository,
	postRepo repository.PostRepository,
	log logger.Logger,
) BlockService {
	return &blockService{
		blockRepo: blockRepo,
		postRepo:  postRepo,
		log:       log,
	}
}

// ListPublic — блоки опубликованного поста для публичной страницы
func (s *blockService) ListPublic(ctx context.Context, slug string) ([]model.Block, error) {
	post, err := s.postRepo.GetBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	if post == nil {
		return nil, errors.New("post not found")
	}
	if post.Status != "published" {
		return nil, errors.New("post not found")
	}
	if post.ContentMode != model.ContentModeBlocks {
		// Пост ещё на Plate — блоков нет
		return []model.Block{}, nil
	}
	return s.blockRepo.ListByPostID(ctx, post.ID)
}

// ListForAdmin — все блоки поста для редактора
func (s *blockService) ListForAdmin(ctx context.Context, postID int64) ([]model.Block, error) {
	return s.blockRepo.ListByPostID(ctx, postID)
}

func (s *blockService) Create(ctx context.Context, data model.BlockCreateData) (*model.Block, error) {
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

	s.log.Info("block created", "block_id", block.ID, "post_id", data.PostID, "type", data.Type)
	return block, nil
}

func (s *blockService) Update(ctx context.Context, id int64, upd model.BlockUpdateData) (*model.Block, error) {
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

func (s *blockService) Delete(ctx context.Context, id int64) error {
	return s.blockRepo.Delete(ctx, id)
}

func (s *blockService) Reorder(ctx context.Context, postID int64, blockIDs []int64) error {
	if len(blockIDs) == 0 {
		return errors.New("empty block list")
	}
	return s.blockRepo.Reorder(ctx, postID, blockIDs)
}

// ConvertPostToBlocks — конвертация Plate-контента в блоки (одноразово).
// Всё содержимое поста становится одним text-блоком.
func (s *blockService) ConvertPostToBlocks(ctx context.Context, postID int64) error {
	post, err := s.postRepo.GetByID(ctx, postID)
	if err != nil {
		return err
	}
	if post == nil {
		return errors.New("post not found")
	}
	if post.ContentMode == model.ContentModeBlocks {
		return errors.New("post is already in blocks mode")
	}

	count, err := s.blockRepo.CountByPostID(ctx, postID)
	if err != nil {
		return err
	}
	if count > 0 {
		return errors.New("post already has blocks")
	}

	// Собираем data для text-блока из старого контента
	var contentJSON json.RawMessage
	if post.ContentJSON != nil {
		contentJSON = *post.ContentJSON
	}
	if len(contentJSON) == 0 || string(contentJSON) == "null" {
		contentJSON = json.RawMessage(`[{"type":"p","children":[{"text":""}]}]`)
	}

	data, err := json.Marshal(map[string]json.RawMessage{
		"content_json": contentJSON,
	})
	if err != nil {
		return fmt.Errorf("failed to marshal block data: %w", err)
	}

	_, err = s.blockRepo.Create(ctx, model.BlockCreateData{
		PostID: postID,
		Type:   model.BlockTypeText,
		Data:   data,
	})
	if err != nil {
		return err
	}

	if err := s.postRepo.UpdateContentMode(ctx, postID, model.ContentModeBlocks); err != nil {
		return err
	}

	s.log.Info("post converted to blocks", "post_id", postID)
	return nil
}
