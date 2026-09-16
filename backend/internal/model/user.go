package model

import "time"

// Роли пользователей
const (
	RoleAdmin   = "admin"
	RoleStudent = "student"
)

// User модель пользователя
type User struct {
	ID           int64     `json:"id"`
	Email        string    `json:"email"`
	Username     string    `json:"username"`
	Role         string    `json:"role"`
	PasswordHash string    `json:"-"` // не сериализуем в JSON
	DisplayName  string    `json:"display_name,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// LoginRequest запрос на вход
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// RegisterRequest запрос на регистрацию студента
type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name,omitempty"`
}

// LoginResponse ответ на вход (только access token, refresh идёт в httpOnly cookie)
type LoginResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int64  `json:"expires_in"` // в секундах
	User        User   `json:"user"`
}

// RefreshRequest запрос на обновление токена
type RefreshRequest struct {
	// refresh token берётся из cookie, но можно и из body для тестов
	RefreshToken string `json:"refresh_token,omitempty"`
}

// RefreshResponse ответ на обновление токена
type RefreshResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int64  `json:"expires_in"` // в секундах
}

// AuthUserResponse ответ с данными пользователя
type AuthUserResponse struct {
	User User `json:"user"`
}
