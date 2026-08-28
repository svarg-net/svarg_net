package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"svarg_net/internal/config"
	"svarg_net/internal/logger"
	"svarg_net/internal/model"
	"svarg_net/internal/service"
)

const (
	refreshCookieName = "refresh_token"
	refreshCookiePath = "/api/v1/auth"
)

// AuthHandler обработчики для авторизации
type AuthHandler struct {
	authService service.AuthService
	cfg         *config.Config
	log         logger.Logger
}

// NewAuthHandler создаёт новый обработчик авторизации
func NewAuthHandler(authService service.AuthService, cfg *config.Config, log logger.Logger) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		cfg:         cfg,
		log:         log,
	}
}

// Login POST /api/v1/auth/login
// Возвращает access token в JSON, refresh token устанавливает в httpOnly cookie
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req model.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	loginResp, refreshToken, err := h.authService.Login(r.Context(), &req)
	if err != nil {
		h.respondError(w, http.StatusUnauthorized, err.Error())
		return
	}

	// Устанавливаем refresh token в httpOnly cookie
	h.setRefreshCookie(w, refreshToken)

	h.respondJSON(w, http.StatusOK, loginResp)
}

// Refresh POST /api/v1/auth/refresh
// Читает refresh token из cookie, возвращает новый access token (с ротацией)
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(refreshCookieName)
	if err != nil || cookie.Value == "" {
		h.respondError(w, http.StatusUnauthorized, "refresh token not found")
		return
	}

	loginResp, newRefreshToken, err := h.authService.RefreshAccessToken(r.Context(), cookie.Value)
	if err != nil {
		h.log.Warn("refresh token validation failed", "error", err)
		// При неудаче очищаем cookie
		h.clearRefreshCookie(w)
		h.respondError(w, http.StatusUnauthorized, "invalid refresh token")
		return
	}

	// Устанавливаем новый refresh token (ротация)
	h.setRefreshCookie(w, newRefreshToken)

	h.respondJSON(w, http.StatusOK, model.RefreshResponse{
		AccessToken: loginResp.AccessToken,
		ExpiresIn:   loginResp.ExpiresIn,
	})
}

// Logout POST /api/v1/auth/logout
// Отзывает refresh token и удаляет cookie
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(refreshCookieName)
	if err == nil && cookie.Value != "" {
		if err := h.authService.RevokeRefreshToken(r.Context(), cookie.Value); err != nil {
			h.log.Warn("failed to revoke refresh token on logout", "error", err)
		}
	}

	// Очищаем cookie
	h.clearRefreshCookie(w)

	h.respondJSON(w, http.StatusOK, map[string]string{"message": "logged out"})
}

// GetMe GET /api/v1/auth/me
func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value("user").(*model.User)
	if !ok {
		h.respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	h.respondJSON(w, http.StatusOK, model.AuthUserResponse{User: *user})
}

// setRefreshCookie устанавливает httpOnly cookie с refresh токеном
func (h *AuthHandler) setRefreshCookie(w http.ResponseWriter, token string) {
	cookie := &http.Cookie{
		Name:     refreshCookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   7 * 24 * 60 * 60,
	}
	http.SetCookie(w, cookie)
}

// clearRefreshCookie удаляет refresh cookie
func (h *AuthHandler) clearRefreshCookie(w http.ResponseWriter) {
	cookie := &http.Cookie{
		Name:     refreshCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
		Expires:  time.Unix(0, 0),
	}
	http.SetCookie(w, cookie)
}

// respondJSON отправляет JSON ответ
func (h *AuthHandler) respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		_ = json.NewEncoder(w).Encode(data)
	}
}

// respondError отправляет ошибку
func (h *AuthHandler) respondError(w http.ResponseWriter, status int, message string) {
	h.respondJSON(w, status, map[string]string{
		"error": message,
	})
}
