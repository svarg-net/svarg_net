package service

import (
	"context"
	"fmt"

	"svarg_net/internal/logger"
	"svarg_net/internal/model"
	"svarg_net/internal/repository"
)

type SearchService interface {
	Search(ctx context.Context, query string, limit, offset int) ([]*model.Post, error)
}

type searchService struct {
	postRepo repository.PostRepository
	log      logger.Logger
}

func NewSearchService(postRepo repository.PostRepository, log logger.Logger) SearchService {
	return &searchService{
		postRepo: postRepo,
		log:      log,
	}
}

func (s *searchService) Search(ctx context.Context, query string, limit, offset int) ([]*model.Post, error) {
	if query == "" {
		return []*model.Post{}, nil
	}

	if limit <= 0 || limit > 50 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	results, err := s.postRepo.Search(ctx, query, "published", limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to search posts: %w", err)
	}

	return results, nil
}
