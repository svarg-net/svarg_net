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
	userRepo := repository.NewUserRepository(pool)
	categoryRepo := repository.NewCategoryRepository(pool)
	tagRepo := repository.NewTagRepository(pool)
	postRepo := repository.NewPostRepository(pool, tagRepo)
	refreshTokenRepo := repository.NewRefreshTokenRepository(pool)

	postService := service.NewPostService(postRepo, tagRepo, log)
	authService := service.NewAuthService(userRepo, refreshTokenRepo, cfg.JWT, log)
	categoryService := service.NewCategoryService(categoryRepo, log)
	tagService := service.NewTagService(tagRepo, log)

	postHandler := handler.NewPostHandler(postService, categoryService, tagService, log)
	authHandler := handler.NewAuthHandler(authService, cfg, log)
	categoryHandler := handler.NewCategoryHandler(categoryService, log)
	tagHandler := handler.NewTagHandler(tagService, log)

	mux := http.NewServeMux()

	// Регистрируем маршруты
	registerRoutes(mux, pool, log, postHandler, authHandler, categoryHandler, tagHandler, authService)

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
	categoryHandler *handler.CategoryHandler,
	tagHandler *handler.TagHandler,
	authService service.AuthService,
) {
	// Health check
	mux.HandleFunc("GET /healthz", healthHandler(pool, log))

	// Auth (публичные)
	mux.HandleFunc("POST /api/v1/auth/login", authHandler.Login)
	mux.HandleFunc("POST /api/v1/auth/refresh", authHandler.Refresh)
	mux.HandleFunc("POST /api/v1/auth/logout", authHandler.Logout)

	// Публичные маршруты
	mux.HandleFunc("GET /api/v1/posts", postHandler.ListPosts)
	mux.HandleFunc("GET /api/v1/posts/{slug}", postHandler.GetPost)
	mux.HandleFunc("GET /api/v1/categories", categoryHandler.ListCategories)
	mux.HandleFunc("GET /api/v1/categories/{slug}", categoryHandler.GetCategory)
	mux.HandleFunc("GET /api/v1/categories/{slug}/posts", postHandler.ListPostsByCategory)
	mux.HandleFunc("GET /api/v1/tags", tagHandler.ListTags)
	mux.HandleFunc("GET /api/v1/tags/{slug}", tagHandler.GetTag)
	mux.HandleFunc("GET /api/v1/tags/{slug}/posts", postHandler.ListPostsByTag)

	// Защищённые маршруты (требуют access token)
	protectedMux := http.NewServeMux()
	protectedMux.HandleFunc("GET /api/v1/auth/me", authHandler.GetMe)
	protectedMux.HandleFunc("POST /api/v1/posts", postHandler.CreatePost)
	protectedMux.HandleFunc("PATCH /api/v1/posts/{id}", postHandler.UpdatePost)
	protectedMux.HandleFunc("DELETE /api/v1/posts/{id}", postHandler.DeletePost)
	protectedMux.HandleFunc("POST /api/v1/categories", categoryHandler.CreateCategory)
	protectedMux.HandleFunc("PATCH /api/v1/categories/{id}", categoryHandler.UpdateCategory)
	protectedMux.HandleFunc("DELETE /api/v1/categories/{id}", categoryHandler.DeleteCategory)
	protectedMux.HandleFunc("POST /api/v1/tags", tagHandler.CreateTag)
	protectedMux.HandleFunc("PATCH /api/v1/tags/{id}", tagHandler.UpdateTag)
	protectedMux.HandleFunc("DELETE /api/v1/tags/{id}", tagHandler.DeleteTag)

	// Применяем auth middleware к защищённым маршрутам
	var protectedHandler http.Handler = protectedMux
	protectedHandler = authMiddleware(protectedHandler, authService, log)

	// Монтируем защищённые маршруты
	mux.Handle("GET /api/v1/auth/me", protectedHandler)
	mux.Handle("POST /api/v1/posts", protectedHandler)
	mux.Handle("PATCH /api/v1/posts/{id}", protectedHandler)
	mux.Handle("DELETE /api/v1/posts/{id}", protectedHandler)
	mux.Handle("POST /api/v1/categories", protectedHandler)
	mux.Handle("PATCH /api/v1/categories/{id}", protectedHandler)
	mux.Handle("DELETE /api/v1/categories/{id}", protectedHandler)
	mux.Handle("PATCH /api/v1/tags/{id}", protectedHandler)
	mux.Handle("POST /api/v1/tags", protectedHandler)
	mux.Handle("DELETE /api/v1/tags/{id}", protectedHandler)
}
