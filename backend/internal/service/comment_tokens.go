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
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

const (
	commentTokenTTL = 15 * time.Minute
	minTimeToReply  = 5 * time.Second
	redisPrefix     = "comment:token:"
)

type tokenPayload struct {
	PostID   int64  `json:"post_id"`
	IPHash   string `json:"ip_hash"`
	IssuedAt int64  `json:"issued_at"`
}

// IssueToken выдаёт одноразовый токен на 15 минут.
// Используется для защиты от ботов, не открывающих страницу поста.
func (s *commentService) IssueToken(
	ctx context.Context,
	postSlug string,
	r *http.Request,
) (string, error) {
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

	tokenID := uuid.NewString()
	key := redisPrefix + tokenID

	if err := s.redis.Set(ctx, key, string(data), commentTokenTTL).Err(); err != nil {
		return "", fmt.Errorf("failed to store token in redis: %w", err)
	}
	return tokenID, nil
}

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

// consumeToken атомарно извлекает и удаляет токен из Redis.
func consumeToken(
	ctx context.Context,
	client *redis.Client,
	token string,
) (*tokenPayload, error) {
	if token == "" {
		return nil, errors.New("missing token")
	}

	val, err := client.GetDel(ctx, redisPrefix+token).Result()
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
	return &payload, nil
}
