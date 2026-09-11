package service

import (
	"context"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"svarg_net/internal/config"
	"svarg_net/internal/logger"
	"svarg_net/internal/model"
	"svarg_net/internal/repository"
)

type AuthService interface {
	Login(ctx context.Context, req *model.LoginRequest) (*model.LoginResponse, string, error)
	GetUserByToken(ctx context.Context, tokenString string) (*model.User, error)
	RefreshAccessToken(ctx context.Context, refreshToken string) (*model.LoginResponse, string, error)
	RevokeRefreshToken(ctx context.Context, refreshToken string) error
	RevokeAllUserTokens(ctx context.Context, userID int64) error
}

type authService struct {
	userRepo         repository.UserRepository
	refreshTokenRepo repository.RefreshTokenRepository
	jwtCfg           config.JWT
	log              logger.Logger
}

func NewAuthService(
	userRepo repository.UserRepository,
	refreshTokenRepo repository.RefreshTokenRepository,
	jwtCfg config.JWT,
	log logger.Logger,
) AuthService {
	return &authService{
		userRepo:         userRepo,
		refreshTokenRepo: refreshTokenRepo,
		jwtCfg:           jwtCfg,
		log:              log,
	}
}

// Login выполняет вход и возвращает access token + refresh token
func (s *authService) Login(ctx context.Context, req *model.LoginRequest) (*model.LoginResponse, string, error) {
	if req.Email == "" || req.Password == "" {
		return nil, "", fmt.Errorf("email and password are required")
	}

	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		s.log.Warn("login attempt with unknown email", "email", req.Email)
		return nil, "", fmt.Errorf("invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		s.log.Warn("login attempt with wrong password", "email", req.Email)
		return nil, "", fmt.Errorf("invalid email or password")
	}

	loginResp, refreshToken, err := s.generateTokenPair(ctx, user)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate tokens: %w", err)
	}

	s.log.Info("user logged in", "user_id", user.ID, "email", user.Email)
	return loginResp, refreshToken, nil
}

// RefreshAccessToken обновляет access token используя refresh token (с ротацией)
func (s *authService) RefreshAccessToken(ctx context.Context, refreshToken string) (*model.LoginResponse, string, error) {
	if refreshToken == "" {
		return nil, "", fmt.Errorf("refresh token is required")
	}

	tokenRow, err := s.refreshTokenRepo.FindByToken(ctx, refreshToken)
	if err != nil {
		s.log.Warn("refresh token not found", "error", err)
		return nil, "", fmt.Errorf("invalid refresh token")
	}

	if tokenRow.RevokedAt != nil {
		s.log.Warn("attempt to use revoked refresh token", "user_id", tokenRow.UserID)
		return nil, "", fmt.Errorf("refresh token was revoked")
	}

	if time.Now().After(tokenRow.ExpiresAt) {
		s.log.Warn("attempt to use expired refresh token", "user_id", tokenRow.UserID)
		_ = s.refreshTokenRepo.Revoke(ctx, refreshToken)
		return nil, "", fmt.Errorf("refresh token expired")
	}

	user, err := s.userRepo.GetByID(ctx, tokenRow.UserID)
	if err != nil {
		return nil, "", fmt.Errorf("user not found: %w", err)
	}

	// РОТАЦИЯ: отзываем старый refresh токен
	if err := s.refreshTokenRepo.Revoke(ctx, refreshToken); err != nil {
		s.log.Error("failed to revoke old refresh token", "error", err)
	}

	loginResp, newRefreshToken, err := s.generateTokenPair(ctx, user)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate new tokens: %w", err)
	}

	s.log.Info("access token refreshed", "user_id", user.ID)
	return loginResp, newRefreshToken, nil
}

func (s *authService) RevokeRefreshToken(ctx context.Context, refreshToken string) error {
	return s.refreshTokenRepo.Revoke(ctx, refreshToken)
}

func (s *authService) RevokeAllUserTokens(ctx context.Context, userID int64) error {
	return s.refreshTokenRepo.RevokeAllForUser(ctx, userID)
}

// GetUserByToken валидирует access token и возвращает пользователя
func (s *authService) GetUserByToken(ctx context.Context, tokenString string) (*model.User, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.jwtCfg.Secret), nil
	})
	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}
	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("invalid token claims")
	}

	userIDFloat, ok := claims["user_id"].(float64)
	if !ok {
		return nil, fmt.Errorf("invalid user_id in token")
	}

	user, err := s.userRepo.GetByID(ctx, int64(userIDFloat))
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	return user, nil
}
