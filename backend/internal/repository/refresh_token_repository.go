package repository

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// RefreshTokenRepository интерфейс для работы с refresh токенами
type RefreshTokenRepository interface {
	Save(ctx context.Context, userID int64, token string, expiresAt time.Time) error
	FindByToken(ctx context.Context, token string) (*RefreshTokenRow, error)
	Revoke(ctx context.Context, token string) error
	RevokeAllForUser(ctx context.Context, userID int64) error
	CleanExpired(ctx context.Context) error
}

// RefreshTokenRow строка из таблицы
type RefreshTokenRow struct {
	ID        int64
	UserID    int64
	TokenHash string
	ExpiresAt time.Time
	CreatedAt time.Time
	RevokedAt *time.Time
}

type refreshTokenRepository struct {
	pool *pgxpool.Pool
}

// NewRefreshTokenRepository создаёт новый репозиторий
func NewRefreshTokenRepository(pool *pgxpool.Pool) RefreshTokenRepository {
	return &refreshTokenRepository{pool: pool}
}

// hashToken хэширует токен с помощью SHA-256
func hashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}

// Save сохраняет новый refresh токен
func (r *refreshTokenRepository) Save(ctx context.Context, userID int64, token string, expiresAt time.Time) error {
	tokenHash := hashToken(token)

	query := `
		INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)
	`

	_, err := r.pool.Exec(ctx, query, userID, tokenHash, expiresAt)
	if err != nil {
		return fmt.Errorf("failed to save refresh token: %w", err)
	}

	return nil
}

// FindByToken ищет токен по значению
func (r *refreshTokenRepository) FindByToken(ctx context.Context, token string) (*RefreshTokenRow, error) {
	tokenHash := hashToken(token)

	query := `
		SELECT id, user_id, token_hash, expires_at, created_at, revoked_at
		FROM refresh_tokens
		WHERE token_hash = $1
	`

	var row RefreshTokenRow
	err := r.pool.QueryRow(ctx, query, tokenHash).Scan(
		&row.ID, &row.UserID, &row.TokenHash, &row.ExpiresAt, &row.CreatedAt, &row.RevokedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("refresh token not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to find refresh token: %w", err)
	}

	return &row, nil
}

// Revoke отзывает токен
func (r *refreshTokenRepository) Revoke(ctx context.Context, token string) error {
	tokenHash := hashToken(token)

	query := `
		UPDATE refresh_tokens
		SET revoked_at = now()
		WHERE token_hash = $1 AND revoked_at IS NULL
	`

	result, err := r.pool.Exec(ctx, query, tokenHash)
	if err != nil {
		return fmt.Errorf("failed to revoke refresh token: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("refresh token not found or already revoked")
	}

	return nil
}

// RevokeAllForUser отзывает все токены пользователя (для выхода со всех устройств)
func (r *refreshTokenRepository) RevokeAllForUser(ctx context.Context, userID int64) error {
	query := `
		UPDATE refresh_tokens
		SET revoked_at = now()
		WHERE user_id = $1 AND revoked_at IS NULL
	`

	_, err := r.pool.Exec(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("failed to revoke all refresh tokens: %w", err)
	}

	return nil
}

// CleanExpired удаляет истёкшие токены
func (r *refreshTokenRepository) CleanExpired(ctx context.Context) error {
	query := `
		DELETE FROM refresh_tokens
		WHERE expires_at < now() OR revoked_at IS NOT NULL
	`

	_, err := r.pool.Exec(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to clean expired refresh tokens: %w", err)
	}

	return nil
}
