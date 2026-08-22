package service

import (
	"context"
	"fmt"

	"svarg_net/internal/logger"
	"svarg_net/internal/model"
	"svarg_net/internal/repository"
)

// CategoryService интерфейс для работы с категориями
type CategoryService interface {
	Create(ctx context.Context, req *model.CategoryCreateRequest) (*model.Category, error)
	GetByID(ctx context.Context, id int64) (*model.Category, error)
	GetBySlug(ctx context.Context, slug string) (*model.Category, error)
	List(ctx context.Context) (*model.CategoryListResponse, error)
	Update(ctx context.Context, id int64, req *model.CategoryUpdateRequest) (*model.Category, error)
	Delete(ctx context.Context, id int64) error
}

type categoryService struct {
	repo repository.CategoryRepository
	log  logger.Logger
}

// NewCategoryService создаёт новый сервис категорий
func NewCategoryService(repo repository.CategoryRepository, log logger.Logger) CategoryService {
	return &categoryService{
		repo: repo,
		log:  log,
	}
}

func (s *categoryService) Create(ctx context.Context, req *model.CategoryCreateRequest) (*model.Category, error) {
	if req.Name == "" {
		return nil, fmt.Errorf("name is required")
	}

	category, err := s.repo.Create(ctx, req)
	if err != nil {
		s.log.Error("failed to create category", "error", err)
		return nil, err
	}

	s.log.Info("category created", "id", category.ID, "name", category.Name)
	return category, nil
}

func (s *categoryService) GetByID(ctx context.Context, id int64) (*model.Category, error) {
	category, err := s.repo.GetByID(ctx, id)
	if err != nil {
		s.log.Error("failed to get category by id", "id", id, "error", err)
		return nil, err
	}
	return category, nil
}

func (s *categoryService) GetBySlug(ctx context.Context, slug string) (*model.Category, error) {
	category, err := s.repo.GetBySlug(ctx, slug)
	if err != nil {
		s.log.Error("failed to get category by slug", "slug", slug, "error", err)
		return nil, err
	}
	return category, nil
}

func (s *categoryService) List(ctx context.Context) (*model.CategoryListResponse, error) {
	response, err := s.repo.List(ctx)
	if err != nil {
		s.log.Error("failed to list categories", "error", err)
		return nil, err
	}
	return response, nil
}

func (s *categoryService) Update(ctx context.Context, id int64, req *model.CategoryUpdateRequest) (*model.Category, error) {
	category, err := s.repo.Update(ctx, id, req)
	if err != nil {
		s.log.Error("failed to update category", "id", id, "error", err)
		return nil, err
	}

	s.log.Info("category updated", "id", category.ID, "name", category.Name)
	return category, nil
}

func (s *categoryService) Delete(ctx context.Context, id int64) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		s.log.Error("failed to delete category", "id", id, "error", err)
		return err
	}

	s.log.Info("category deleted", "id", id)
	return nil
}
