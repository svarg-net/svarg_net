package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	"svarg_net/internal/logger"
	"svarg_net/internal/model"
	"svarg_net/internal/repository"
)

// Константы
const (
	commentTokenTTL = 15 * time.Minute
	minTimeToReply  = 5 * time.Second
	redisPrefix     = "comment:token:"
)

// Стоп-слова (корни — мат, оскорбления). Простой MVP-список.
// Позже можно вынести в таблицу БД и редактировать из админки.
var forbiddenWords = []string{
	// мат
	"блядь", "блять", "бля", "хуй", "хуя", "хуёв", "пизд", "пизд",
	"ебать", "ебан", "ёбан", "ебн", "ебуч",
	"сука", "сук", "пидор", "пидар", "мудак", "муда", "залуп",
	"гандон", "шлюх", "долбо", "дебил",
	// оскорбления (пример, расширять по ситуации)
	"идиот", "дурак", "придурок", "урод", "тварь", "дерьм",
}

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

// =========== Токены ===========

type tokenPayload struct {
	PostID   int64  `json:"post_id"`
	IPHash   string `json:"ip_hash"`
	IssuedAt int64  `json:"issued_at"`
}

// IssueToken выдаёт одноразовый токен на 15 минут.
// Используется для защиты от ботов, не открывающих страницу поста.
func (s *commentService) IssueToken(ctx context.Context, postSlug string, r *http.Request) (string, error) {
	post, err := s.postRepo.GetBySlug(ctx, postSlug)
	if err != nil {
		return "", fmt.Errorf("post not found: %w", err)
	}
	if post == nil {
		return "", errors.New("post not found")
	}

	enabled, err := s.commentRepo.CommentsEnabled(ctx, post.ID)
	if err != nil {
		return "", err
	}
	if !enabled {
		return "", errors.New("comments are closed for this post")
	}

	ipHash := hashIP(r)
	payload := tokenPayload{
		PostID:   post.ID,
		IPHash:   ipHash,
		IssuedAt: time.Now().Unix(),
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("failed to marshal token payload: %w", err)
	}

	// Токен = UUID, значение = JSON, TTL = 15 мин
	tokenID := uuid.NewString()
	key := redisPrefix + tokenID

	err = s.redis.Set(ctx, key, string(data), commentTokenTTL).Err()
	if err != nil {
		return "", fmt.Errorf("failed to store token in redis: %w", err)
	}

	return tokenID, nil
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

	// 3. Валидация и потребление токена (атомарно через GETDEL)
	if token == "" {
		return nil, errors.New("missing token")
	}
	key := redisPrefix + token

	val, err := s.redis.GetDel(ctx, key).Result()
	if err == redis.Nil {
		return nil, errors.New("token is invalid or expired")
	}
	if err != nil {
		return nil, fmt.Errorf("redis error: %w", err)
	}

	var payload tokenPayload
	if err := json.Unmarshal([]byte(val), &payload); err != nil {
		return nil, errors.New("invalid token")
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
		// Не допускаем вложенности глубже 1 уровня
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
	ipHash := hashIP(r)
	comment, err := s.commentRepo.Create(ctx, data, ipHash)
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

	// Строим дерево (1 уровень)
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

// =========== Вспомогательные ===========

// hashIP — sha256 от IP. Сохраняем только хэш, не сам IP.
func hashIP(r *http.Request) string {
	ip := ""
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		ip = strings.TrimSpace(strings.Split(xff, ",")[0])
	} else if xrip := r.Header.Get("X-Real-Ip"); xrip != "" {
		ip = xrip
	} else {
		host, _, err := net.SplitHostPort(r.RemoteAddr)
		if err == nil {
			ip = host
		} else {
			ip = r.RemoteAddr
		}
	}
	h := sha256.Sum256([]byte(ip))
	return hex.EncodeToString(h[:])
}

func validateCommentFields(d model.CommentCreateData) error {
	name := strings.TrimSpace(d.AuthorName)
	if name == "" {
		return errors.New("name is required")
	}
	if len(name) < 2 || len(name) > 100 {
		return errors.New("name must be between 2 and 100 characters")
	}

	content := strings.TrimSpace(d.Content)
	if content == "" {
		return errors.New("content is required")
	}
	if len(content) < 3 || len(content) > 5000 {
		return errors.New("content must be between 3 and 5000 characters")
	}

	if d.AuthorEmail != nil && *d.AuthorEmail != "" {
		email := strings.TrimSpace(*d.AuthorEmail)
		emailRe := regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)
		if !emailRe.MatchString(email) {
			return errors.New("invalid email format")
		}
	}

	return nil
}

func containsForbidden(text string) bool {
	lower := strings.ToLower(text)
	for _, word := range forbiddenWords {
		if strings.Contains(lower, word) {
			return true
		}
	}
	return false
}

// buildTree группирует плоский список в дерево с 1 уровнем вложенности.
func buildTree(flat []model.Comment) []model.Comment {
	byID := make(map[int64]*model.Comment, len(flat))
	for i := range flat {
		c := &flat[i]
		c.Replies = nil
		byID[c.ID] = c
	}

	var roots []model.Comment
	for i := range flat {
		c := &flat[i]
		if c.ParentID == nil {
			roots = append(roots, *c)
		} else {
			if parent, ok := byID[*c.ParentID]; ok {
				parent.Replies = append(parent.Replies, *c)
			} else {
				// orphan — считаем корневым
				roots = append(roots, *c)
			}
		}
	}
	return roots
}
