package service

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"svarg_net/internal/model"
)

const (
	AccessTokenExpiration  = 15 * time.Minute
	RefreshTokenExpiration = 7 * 24 * time.Hour // 7 дней
)

// generateTokenPair генерирует пару access + refresh токенов
func (s *authService) generateTokenPair(
	ctx context.Context,
	user *model.User,
) (*model.LoginResponse, string, error) {
	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return nil, "", err
	}

	refreshToken, refreshExpiry, err := s.generateRefreshToken()
	if err != nil {
		return nil, "", err
	}

	if err := s.refreshTokenRepo.Save(ctx, user.ID, refreshToken, refreshExpiry); err != nil {
		return nil, "", fmt.Errorf("failed to save refresh token: %w", err)
	}

	return &model.LoginResponse{
		AccessToken: accessToken,
		ExpiresIn:   int64(AccessTokenExpiration.Seconds()), // 900 секунд
		User:        *user,
	}, refreshToken, nil
}

// generateAccessToken создаёт короткий access token (15 минут)
func (s *authService) generateAccessToken(user *model.User) (string, error) {
	expiresAt := time.Now().Add(AccessTokenExpiration)

	claims := jwt.MapClaims{
		"user_id":  user.ID,
		"email":    user.Email,
		"username": user.Username,
		"type":     "access",
		"exp":      expiresAt.Unix(),
		"iat":      time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtCfg.Secret))
}

// generateRefreshToken создаёт случайный refresh token
func (s *authService) generateRefreshToken() (string, time.Time, error) {
	randomBytes := make([]byte, 32)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", time.Time{}, fmt.Errorf("failed to generate random bytes: %w", err)
	}

	return base64.URLEncoding.EncodeToString(randomBytes),
		time.Now().Add(RefreshTokenExpiration),
		nil
}
