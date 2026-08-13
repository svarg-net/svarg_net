package router

import (
	"net/http"

	"svarg_net/internal/config"
	"svarg_net/internal/handler"
	"svarg_net/internal/logger"
	"svarg_net/internal/repository"
	"svarg_net/internal/service"

	"github.com/jackc/pgx/v5/pgxpool"
)

// New создаёт и настраивает HTTP роутер
func New(cfg *config.Config, pool *pgxpool.Pool, log logger.Logger) http.Handler {
	// Создаём зависимости
	postRepo := repository.NewPostRepository(pool)
	userRepo := repository.NewUserRepository(pool)

	postService := service.NewPostService(postRepo, log)
	authService := service.NewAuthService(userRepo, cfg.JWT, log)

	postHandler := handler.NewPostHandler(postService, log)
	authHandler := handler.NewAuthHandler(authService, log)

	mux := http.NewServeMux()

	// Регистрируем маршруты
	registerRoutes(mux, pool, log, postHandler, authHandler, authService)

	// Применяем middleware
	var handler http.Handler = mux
	handler = corsMiddleware(handler, cfg.CORS.AllowedOrigins)
	handler = loggingMiddleware(handler, log)

	return handler
}

// registerRoutes регистрирует все маршруты приложения
func registerRoutes(
	mux *http.ServeMux,
	pool *pgxpool.Pool,
	log logger.Logger,
	postHandler *handler.PostHandler,
	authHandler *handler.AuthHandler,
	authService service.AuthService,
) {
	// Health check
	mux.HandleFunc("GET /healthz", healthHandler(pool, log))

	// Auth
	mux.HandleFunc("POST /api/v1/auth/login", authHandler.Login)

	// Защищённые маршруты (требуют авторизации)
	protectedMux := http.NewServeMux()
	protectedMux.HandleFunc("GET /api/v1/auth/me", authHandler.GetMe)
	protectedMux.HandleFunc("POST /api/v1/posts", postHandler.CreatePost)
	protectedMux.HandleFunc("PATCH /api/v1/posts/{id}", postHandler.UpdatePost)
	protectedMux.HandleFunc("DELETE /api/v1/posts/{id}", postHandler.DeletePost)

	// Применяем auth middleware к защищённым маршрутам
	var protectedHandler http.Handler = protectedMux
	protectedHandler = authMiddleware(protectedHandler, authService, log)

	// Монтируем защищённые маршруты
	mux.Handle("GET /api/v1/auth/me", protectedHandler)
	mux.Handle("POST /api/v1/posts", protectedHandler)
	mux.Handle("PATCH /api/v1/posts/{id}", protectedHandler)
	mux.Handle("DELETE /api/v1/posts/{id}", protectedHandler)

	// Публичные маршруты
	mux.HandleFunc("GET /api/v1/posts", postHandler.ListPosts)
	mux.HandleFunc("GET /api/v1/posts/{slug}", postHandler.GetPost)
}
