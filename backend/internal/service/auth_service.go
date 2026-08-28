package service

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"svarg_net/internal/config"
	"svarg_net/internal/logger"
	"svarg_net/internal/model"
	"svarg_net/internal/repository"
)

// Константы для времени жизни токенов
const (
	AccessTokenExpiration  = 15 * time.Minute
	RefreshTokenExpiration = 7 * 24 * time.Hour // 7 дней
)

// AuthService интерфейс для авторизации
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

// NewAuthService создаёт новый сервис авторизации
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

	// Ищем пользователя
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		s.log.Warn("login attempt with unknown email", "email", req.Email)
		return nil, "", fmt.Errorf("invalid email or password")
	}

	// Проверяем пароль
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		s.log.Warn("login attempt with wrong password", "email", req.Email)
		return nil, "", fmt.Errorf("invalid email or password")
	}

	// Генерируем пару токенов
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

	// Находим токен в базе
	tokenRow, err := s.refreshTokenRepo.FindByToken(ctx, refreshToken)
	if err != nil {
		s.log.Warn("refresh token not found", "error", err)
		return nil, "", fmt.Errorf("invalid refresh token")
	}

	// Проверяем что не отозван
	if tokenRow.RevokedAt != nil {
		s.log.Warn("attempt to use revoked refresh token", "user_id", tokenRow.UserID)
		return nil, "", fmt.Errorf("refresh token was revoked")
	}

	// Проверяем что не истёк
	if time.Now().After(tokenRow.ExpiresAt) {
		s.log.Warn("attempt to use expired refresh token", "user_id", tokenRow.UserID)
		// Отзываем истёкший токен
		_ = s.refreshTokenRepo.Revoke(ctx, refreshToken)
		return nil, "", fmt.Errorf("refresh token expired")
	}

	// Получаем пользователя
	user, err := s.userRepo.GetByID(ctx, tokenRow.UserID)
	if err != nil {
		return nil, "", fmt.Errorf("user not found: %w", err)
	}

	// РОТАЦИЯ: отзываем старый refresh токен
	if err := s.refreshTokenRepo.Revoke(ctx, refreshToken); err != nil {
		s.log.Error("failed to revoke old refresh token", "error", err)
	}

	// Генерируем новую пару токенов
	loginResp, newRefreshToken, err := s.generateTokenPair(ctx, user)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate new tokens: %w", err)
	}

	s.log.Info("access token refreshed", "user_id", user.ID)

	return loginResp, newRefreshToken, nil
}

// RevokeRefreshToken отзывает конкретный refresh token (для logout)
func (s *authService) RevokeRefreshToken(ctx context.Context, refreshToken string) error {
	return s.refreshTokenRepo.Revoke(ctx, refreshToken)
}

// RevokeAllUserTokens отзывает все refresh токены пользователя (logout со всех устройств)
func (s *authService) RevokeAllUserTokens(ctx context.Context, userID int64) error {
	return s.refreshTokenRepo.RevokeAllForUser(ctx, userID)
}

// GetUserByToken валидирует access token и возвращает пользователя
func (s *authService) GetUserByToken(ctx context.Context, tokenString string) (*model.User, error) {
	// Парсим токен
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

	// Получаем user_id из токена
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("invalid token claims")
	}

	userIDFloat, ok := claims["user_id"].(float64)
	if !ok {
		return nil, fmt.Errorf("invalid user_id in token")
	}
	userID := int64(userIDFloat)

	// Получаем пользователя
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	return user, nil
}

// generateTokenPair генерирует пару access + refresh токенов
func (s *authService) generateTokenPair(ctx context.Context, user *model.User) (*model.LoginResponse, string, error) {
	// 1. Генерируем короткий access token (15 минут)
	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return nil, "", err
	}

	// 2. Генерируем длинный refresh token (7 дней)
	refreshToken, refreshExpiry, err := s.generateRefreshToken()
	if err != nil {
		return nil, "", err
	}

	// 3. Сохраняем refresh token в базе
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
	tokenString, err := token.SignedString([]byte(s.jwtCfg.Secret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// generateRefreshToken создаёт случайный refresh token
func (s *authService) generateRefreshToken() (string, time.Time, error) {
	// Генерируем 32 случайных байта
	randomBytes := make([]byte, 32)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", time.Time{}, fmt.Errorf("failed to generate random bytes: %w", err)
	}

	// Кодируем в base64
	token := base64.URLEncoding.EncodeToString(randomBytes)
	expiresAt := time.Now().Add(RefreshTokenExpiration)

	return token, expiresAt, nil
}
