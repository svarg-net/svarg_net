package service

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/redis/go-redis/v9"

	"svarg_net/internal/logger"
	"svarg_net/internal/model"
	"svarg_net/internal/repository"
)

type CommentService interface {
	IssueToken(ctx context.Context, postSlug string, r *http.Request) (string, error)
	CreateComment(ctx context.Context, data model.CommentCreateData, token, honeypot string, r *http.Request) (*model.Comment, error)
	GetByPostID(ctx context.Context, postSlug string) ([]model.Comment, int, error)
	ListPending(ctx context.Context, limit, offset int) ([]model.Comment, error)
	CountPending(ctx context.Context) (int, error)
	Approve(ctx context.Context, id int64) error
	Reject(ctx context.Context, id int64) error
	Delete(ctx context.Context, id int64) error
	GetByID(ctx context.Context, id int64) (*model.Comment, error)
}

type commentService struct {
	commentRepo repository.CommentRepository
	postRepo    repository.PostRepository
	redis       *redis.Client
	log         logger.Logger
}

func NewCommentService(
	commentRepo repository.CommentRepository,
	postRepo repository.PostRepository,
	redisClient *redis.Client,
	log logger.Logger,
) CommentService {
	return &commentService{
		commentRepo: commentRepo,
		postRepo:    postRepo,
		redis:       redisClient,
		log:         log,
	}
}

// =========== Создание комментария ===========

func (s *commentService) CreateComment(
	ctx context.Context,
	data model.CommentCreateData,
	token, honeypot string,
	r *http.Request,
) (*model.Comment, error) {
	// 1. Honeypot — боты заполняют скрытое поле
	if honeypot != "" {
		return nil, errors.New("spam detected")
	}

	// 2. Валидация полей
	if err := validateCommentFields(data); err != nil {
		return nil, err
	}

	// 3. Валидация и потребление токена
	payload, err := consumeToken(ctx, s.redis, token)
	if err != nil {
		return nil, err
	}

	// 4. Проверяем что прошло минимум 5 секунд (боты шлют мгновенно)
	if time.Since(time.Unix(payload.IssuedAt, 0)) < minTimeToReply {
		return nil, errors.New("too fast")
	}

	// 5. IP токена совпадает с текущим
	if payload.IPHash != hashIP(r) {
		return nil, errors.New("token mismatch")
	}

	// 6. Токен выдан для этого поста
	if payload.PostID != data.PostID {
		return nil, errors.New("token for different post")
	}

	// 7. Комментарии открыты?
	enabled, err := s.commentRepo.CommentsEnabled(ctx, data.PostID)
	if err != nil {
		return nil, err
	}
	if !enabled {
		return nil, errors.New("comments are closed for this post")
	}

	// 8. Если ответ — проверяем что parent_id принадлежит тому же посту
	if data.ParentID != nil {
		parent, err := s.commentRepo.GetByID(ctx, *data.ParentID)
		if err != nil {
			return nil, err
		}
		if parent == nil || parent.PostID != data.PostID {
			return nil, errors.New("invalid parent comment")
		}
		if parent.ParentID != nil {
			return nil, errors.New("max nesting level is 1")
		}
	}

	// 9. Проверка на стоп-слова
	if containsForbidden(data.Content) {
		return nil, errors.New("forbidden content")
	}
	if containsForbidden(data.AuthorName) {
		return nil, errors.New("forbidden content in name")
	}

	// 10. Создаём
	comment, err := s.commentRepo.Create(ctx, data, hashIP(r))
	if err != nil {
		return nil, err
	}

	s.log.Info("comment created",
		"comment_id", comment.ID,
		"post_id", data.PostID,
		"status", comment.Status,
	)
	return comment, nil
}

// =========== Чтение ===========

func (s *commentService) GetByPostID(ctx context.Context, postSlug string) ([]model.Comment, int, error) {
	post, err := s.postRepo.GetBySlug(ctx, postSlug)
	if err != nil {
		return nil, 0, err
	}
	if post == nil {
		return nil, 0, errors.New("post not found")
	}

	comments, err := s.commentRepo.GetByPostID(ctx, post.ID, true /* onlyApproved */)
	if err != nil {
		return nil, 0, err
	}

	return buildTree(comments), len(comments), nil
}

func (s *commentService) ListPending(ctx context.Context, limit, offset int) ([]model.Comment, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.commentRepo.ListPending(ctx, limit, offset)
}

func (s *commentService) CountPending(ctx context.Context) (int, error) {
	return s.commentRepo.CountPending(ctx)
}

func (s *commentService) GetByID(ctx context.Context, id int64) (*model.Comment, error) {
	return s.commentRepo.GetByID(ctx, id)
}

// =========== Модерация ===========

func (s *commentService) Approve(ctx context.Context, id int64) error {
	return s.commentRepo.UpdateStatus(ctx, id, model.CommentStatusApproved)
}

func (s *commentService) Reject(ctx context.Context, id int64) error {
	return s.commentRepo.UpdateStatus(ctx, id, model.CommentStatusRejected)
}

func (s *commentService) Delete(ctx context.Context, id int64) error {
	return s.commentRepo.Delete(ctx, id)
}
