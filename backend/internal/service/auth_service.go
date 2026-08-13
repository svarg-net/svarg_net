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

// AuthService интерфейс для авторизации
type AuthService interface {
	Login(ctx context.Context, req *model.LoginRequest) (*model.LoginResponse, error)
	GetUserByToken(ctx context.Context, tokenString string) (*model.User, error)
}

type authService struct {
	userRepo repository.UserRepository
	jwtCfg   config.JWT
	log      logger.Logger
}

// NewAuthService создаёт новый сервис авторизации
func NewAuthService(userRepo repository.UserRepository, jwtCfg config.JWT, log logger.Logger) AuthService {
	return &authService{
		userRepo: userRepo,
		jwtCfg:   jwtCfg,
		log:      log,
	}
}

func (s *authService) Login(ctx context.Context, req *model.LoginRequest) (*model.LoginResponse, error) {
	if req.Email == "" || req.Password == "" {
		return nil, fmt.Errorf("email and password are required")
	}

	// Ищем пользователя
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		s.log.Warn("login attempt with unknown email", "email", req.Email)
		return nil, fmt.Errorf("invalid email or password")
	}

	// Проверяем пароль
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		s.log.Warn("login attempt with wrong password", "email", req.Email)
		return nil, fmt.Errorf("invalid email or password")
	}

	// Генерируем JWT
	token, expiresAt, err := s.generateToken(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	s.log.Info("user logged in", "user_id", user.ID, "email", user.Email)

	return &model.LoginResponse{
		Token:     token,
		ExpiresAt: expiresAt,
		User:      *user,
	}, nil
}

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

func (s *authService) generateToken(user *model.User) (string, int64, error) {
	expiresAt := time.Now().Add(time.Duration(s.jwtCfg.ExpirationHours) * time.Hour)

	claims := jwt.MapClaims{
		"user_id":  user.ID,
		"email":    user.Email,
		"username": user.Username,
		"exp":      expiresAt.Unix(),
		"iat":      time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.jwtCfg.Secret))
	if err != nil {
		return "", 0, err
	}

	return tokenString, expiresAt.Unix(), nil
}
