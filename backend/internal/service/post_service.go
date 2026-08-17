package service

import (
	"context"
	"fmt"

	"svarg_net/internal/logger"
	"svarg_net/internal/model"
	"svarg_net/internal/repository"
)

// PostService интерфейс для работы с постами
type PostService interface {
	Create(ctx context.Context, req *model.PostCreateRequest) (*model.Post, error)
	GetByID(ctx context.Context, id int64) (*model.Post, error)
	GetBySlug(ctx context.Context, slug string) (*model.Post, error)
	List(ctx context.Context, status string, page, perPage int) (*model.PostListResponse, error)
	ListByCategory(ctx context.Context, categoryID int64, status string, page, perPage int) (*model.PostListResponse, error)
	ListByTag(ctx context.Context, tagID int64, status string, page, perPage int) (*model.PostListResponse, error)
	Update(ctx context.Context, id int64, req *model.PostUpdateRequest) (*model.Post, error)
	Delete(ctx context.Context, id int64) error
}

type postService struct {
	repo    repository.PostRepository
	tagRepo repository.TagRepository
	log     logger.Logger
}

// NewPostService создаёт новый сервис постов
func NewPostService(repo repository.PostRepository, tagRepo repository.TagRepository, log logger.Logger) PostService {
	return &postService{
		repo:    repo,
		tagRepo: tagRepo,
		log:     log,
	}
}

func (s *postService) Create(ctx context.Context, req *model.PostCreateRequest) (*model.Post, error) {
	if err := s.validateCreateRequest(req); err != nil {
		return nil, err
	}

	// TODO: получить author_id из контекста (после реализации авторизации)
	authorID := int64(1)

	post, err := s.repo.Create(ctx, req, authorID)
	if err != nil {
		s.log.Error("failed to create post", "error", err)
		return nil, err
	}

	// Устанавливаем теги если они переданы
	if len(req.TagIDs) > 0 {
		if err := s.tagRepo.SetPostTags(ctx, post.ID, req.TagIDs); err != nil {
			s.log.Error("failed to set post tags", "post_id", post.ID, "error", err)
		}
	}

	// Загружаем теги для ответа
	tags, err := s.tagRepo.GetPostTags(ctx, post.ID)
	if err == nil {
		post.Tags = tags
	}

	s.log.Info("post created", "id", post.ID, "slug", post.Slug)
	return post, nil
}

func (s *postService) GetByID(ctx context.Context, id int64) (*model.Post, error) {
	post, err := s.repo.GetByID(ctx, id)
	if err != nil {
		s.log.Error("failed to get post by id", "id", id, "error", err)
		return nil, err
	}

	// Загружаем теги
	tags, err := s.tagRepo.GetPostTags(ctx, post.ID)
	if err == nil {
		post.Tags = tags
	}

	return post, nil
}

func (s *postService) GetBySlug(ctx context.Context, slug string) (*model.Post, error) {
	post, err := s.repo.GetBySlug(ctx, slug)
	if err != nil {
		s.log.Error("failed to get post by slug", "slug", slug, "error", err)
		return nil, err
	}

	// Загружаем теги
	tags, err := s.tagRepo.GetPostTags(ctx, post.ID)
	if err == nil {
		post.Tags = tags
	}

	return post, nil
}

func (s *postService) List(ctx context.Context, status string, page, perPage int) (*model.PostListResponse, error) {
	// Валидируем статус
	if status != "" && status != model.PostStatusDraft &&
		status != model.PostStatusPublished && status != model.PostStatusArchived {
		return nil, fmt.Errorf("invalid status: %s", status)
	}

	response, err := s.repo.List(ctx, status, page, perPage)
	if err != nil {
		s.log.Error("failed to list posts", "error", err)
		return nil, err
	}

	// Загружаем теги для каждого поста
	for i := range response.Items {
		tags, err := s.tagRepo.GetPostTags(ctx, response.Items[i].ID)
		if err == nil {
			response.Items[i].Tags = tags
		}
	}

	return response, nil
}

func (s *postService) ListByCategory(ctx context.Context, categoryID int64, status string, page, perPage int) (*model.PostListResponse, error) {
	response, err := s.repo.ListByCategory(ctx, categoryID, status, page, perPage)
	if err != nil {
		s.log.Error("failed to list posts by category", "category_id", categoryID, "error", err)
		return nil, err
	}

	// Загружаем теги для каждого поста
	for i := range response.Items {
		tags, err := s.tagRepo.GetPostTags(ctx, response.Items[i].ID)
		if err == nil {
			response.Items[i].Tags = tags
		}
	}

	return response, nil
}

func (s *postService) ListByTag(ctx context.Context, tagID int64, status string, page, perPage int) (*model.PostListResponse, error) {
	response, err := s.repo.ListByTag(ctx, tagID, status, page, perPage)
	if err != nil {
		s.log.Error("failed to list posts by tag", "tag_id", tagID, "error", err)
		return nil, err
	}

	// Загружаем теги для каждого поста
	for i := range response.Items {
		tags, err := s.tagRepo.GetPostTags(ctx, response.Items[i].ID)
		if err == nil {
			response.Items[i].Tags = tags
		}
	}

	return response, nil
}

func (s *postService) Update(ctx context.Context, id int64, req *model.PostUpdateRequest) (*model.Post, error) {
	if err := s.validateUpdateRequest(req); err != nil {
		return nil, err
	}

	post, err := s.repo.Update(ctx, id, req)
	if err != nil {
		s.log.Error("failed to update post", "id", id, "error", err)
		return nil, err
	}

	// Обновляем теги если они переданы
	if req.TagIDs != nil {
		if err := s.tagRepo.SetPostTags(ctx, id, *req.TagIDs); err != nil {
			s.log.Error("failed to set post tags", "post_id", id, "error", err)
		}
	}

	// Загружаем теги для ответа
	tags, err := s.tagRepo.GetPostTags(ctx, id)
	if err == nil {
		post.Tags = tags
	}

	s.log.Info("post updated", "id", post.ID, "slug", post.Slug)
	return post, nil
}

func (s *postService) Delete(ctx context.Context, id int64) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		s.log.Error("failed to delete post", "id", id, "error", err)
		return err
	}

	s.log.Info("post deleted", "id", id)
	return nil
}

func (s *postService) validateCreateRequest(req *model.PostCreateRequest) error {
	if req.Title == "" {
		return fmt.Errorf("title is required")
	}

	// Проверяем что есть хотя бы один тип контента (markdown или JSON)
	hasContent := false
	if req.ContentMD != "" {
		hasContent = true
	}
	if req.ContentJSON != nil && len(*req.ContentJSON) > 0 && string(*req.ContentJSON) != "null" {
		hasContent = true
	}

	if !hasContent {
		return fmt.Errorf("content_md or content_json is required")
	}

	if req.Status == "" {
		req.Status = model.PostStatusDraft
	}
	if req.Status != model.PostStatusDraft &&
		req.Status != model.PostStatusPublished &&
		req.Status != model.PostStatusArchived {
		return fmt.Errorf("invalid status: %s", req.Status)
	}
	return nil
}

func (s *postService) validateUpdateRequest(req *model.PostUpdateRequest) error {
	if req.Status != nil {
		if *req.Status != model.PostStatusDraft &&
			*req.Status != model.PostStatusPublished &&
			*req.Status != model.PostStatusArchived {
			return fmt.Errorf("invalid status: %s", *req.Status)
		}
	}
	return nil
}
