package service

import (
	"context"
	"fmt"

	"svarg_net/internal/logger"
	"svarg_net/internal/model"
	"svarg_net/internal/repository"
)

// TagService интерфейс для работы с тегами
type TagService interface {
	Create(ctx context.Context, req *model.TagCreateRequest) (*model.Tag, error)
	GetByID(ctx context.Context, id int64) (*model.Tag, error)
	GetBySlug(ctx context.Context, slug string) (*model.Tag, error)
	List(ctx context.Context) (*model.TagListResponse, error)
	Update(ctx context.Context, id int64, req *model.TagUpdateRequest) (*model.Tag, error)
	Delete(ctx context.Context, id int64) error
	GetPostTags(ctx context.Context, postID int64) ([]model.Tag, error)
	SetPostTags(ctx context.Context, postID int64, tagIDs []int64) error
}
type tagService struct {
	repo repository.TagRepository
	log  logger.Logger
}

// NewTagService создаёт новый сервис тегов
func NewTagService(repo repository.TagRepository, log logger.Logger) TagService {
	return &tagService{
		repo: repo,
		log:  log,
	}
}

func (s *tagService) Create(ctx context.Context, req *model.TagCreateRequest) (*model.Tag, error) {
	if req.Name == "" {
		return nil, fmt.Errorf("name is required")
	}

	tag, err := s.repo.Create(ctx, req)
	if err != nil {
		s.log.Error("failed to create tag", "error", err)
		return nil, err
	}

	s.log.Info("tag created", "id", tag.ID, "name", tag.Name)
	return tag, nil
}

func (s *tagService) Update(ctx context.Context, id int64, req *model.TagUpdateRequest) (*model.Tag, error) {
	tag, err := s.repo.Update(ctx, id, req)
	if err != nil {
		s.log.Error("failed to update tag", "id", id, "error", err)
		return nil, err
	}

	s.log.Info("tag updated", "id", tag.ID, "name", tag.Name)
	return tag, nil
}

func (s *tagService) GetByID(ctx context.Context, id int64) (*model.Tag, error) {
	tag, err := s.repo.GetByID(ctx, id)
	if err != nil {
		s.log.Error("failed to get tag by id", "id", id, "error", err)
		return nil, err
	}
	return tag, nil
}

func (s *tagService) GetBySlug(ctx context.Context, slug string) (*model.Tag, error) {
	tag, err := s.repo.GetBySlug(ctx, slug)
	if err != nil {
		s.log.Error("failed to get tag by slug", "slug", slug, "error", err)
		return nil, err
	}
	return tag, nil
}

func (s *tagService) List(ctx context.Context) (*model.TagListResponse, error) {
	response, err := s.repo.List(ctx)
	if err != nil {
		s.log.Error("failed to list tags", "error", err)
		return nil, err
	}
	return response, nil
}

func (s *tagService) Delete(ctx context.Context, id int64) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		s.log.Error("failed to delete tag", "id", id, "error", err)
		return err
	}

	s.log.Info("tag deleted", "id", id)
	return nil
}

func (s *tagService) GetPostTags(ctx context.Context, postID int64) ([]model.Tag, error) {
	tags, err := s.repo.GetPostTags(ctx, postID)
	if err != nil {
		s.log.Error("failed to get post tags", "post_id", postID, "error", err)
		return nil, err
	}
	return tags, nil
}

func (s *tagService) SetPostTags(ctx context.Context, postID int64, tagIDs []int64) error {
	if err := s.repo.SetPostTags(ctx, postID, tagIDs); err != nil {
		s.log.Error("failed to set post tags", "post_id", postID, "error", err)
		return err
	}

	s.log.Info("post tags updated", "post_id", postID, "tag_count", len(tagIDs))
	return nil
}
