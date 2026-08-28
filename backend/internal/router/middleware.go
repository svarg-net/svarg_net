package router

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"svarg_net/internal/logger"
	"svarg_net/internal/service"
)

// corsMiddleware добавляет CORS заголовки
// corsMiddleware добавляет CORS заголовки
func corsMiddleware(next http.Handler, allowedOrigins []string) http.Handler {
	allowedMap := make(map[string]struct{})
	for _, origin := range allowedOrigins {
		allowedMap[origin] = struct{}{}
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		if origin != "" {
			if _, ok := allowedMap[origin]; ok {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Vary", "Origin")
				// ✅ ВАЖНО для работы httpOnly cookies между localhost:3000 и localhost:8080
				w.Header().Set("Access-Control-Allow-Credentials", "true")
				w.Header().Set(
					"Access-Control-Allow-Methods",
					"GET, POST, PUT, PATCH, DELETE, OPTIONS",
				)
				w.Header().Set(
					"Access-Control-Allow-Headers",
					"Content-Type, Authorization",
				)
				w.Header().Set("Access-Control-Max-Age", "600")
			}
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// loggingMiddleware логирует все входящие запросы
func loggingMiddleware(next http.Handler, log logger.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		next.ServeHTTP(wrapped, r)

		log.Info("request completed",
			"method", r.Method,
			"path", r.URL.Path,
			"status", wrapped.statusCode,
			"duration", time.Since(start).String(),
			"remote_addr", r.RemoteAddr,
		)
	})
}

// authMiddleware проверяет JWT токен и добавляет пользователя в контекст
func authMiddleware(next http.Handler, authService service.AuthService, log logger.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(map[string]string{
				"error": "authorization header is required",
			})
			return
		}

		// Извлекаем токен из заголовка "Bearer <token>"
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(map[string]string{
				"error": "invalid authorization header format",
			})
			return
		}

		tokenString := parts[1]

		// Получаем пользователя по токену
		user, err := authService.GetUserByToken(r.Context(), tokenString)
		if err != nil {
			log.Warn("invalid token", "error", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(map[string]string{
				"error": "invalid token",
			})
			return
		}

		// Добавляем пользователя в контекст
		ctx := context.WithValue(r.Context(), "user", user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// responseWriter обёртка для перехвата статуса ответа
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

// WriteHeader перехватывает статус ответа
func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}
