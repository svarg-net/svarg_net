package router

import (
	"net/http"
	"time"

	"svarg_net/internal/config"
	"svarg_net/internal/handler"
	"svarg_net/internal/logger"
	"svarg_net/internal/repository"
	"svarg_net/internal/service"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/time/rate"
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

	mediaRepo := repository.NewMediaRepository(pool)
	mediaService := service.NewMediaService(mediaRepo, log)
	mediaHandler := handler.NewMediaHandler(mediaService, log)
	// Rate limiting: общий для API и строгий для логина (brute force)
	generalLimiter := newRateLimiterStore(rate.Limit(20), 40)       // 20 rps, burst 40
	loginLimiter := newRateLimiterStore(rate.Every(time.Minute), 5) // 5 попыток, затем 1/мин
	searchService := service.NewSearchService(postRepo, log)
	searchHandler := handler.NewSearchHandler(searchService, log)
	mux := http.NewServeMux()

	// Регистрируем маршруты
	registerRoutes(mux,
		pool,
		log,
		postHandler,
		authHandler,
		categoryHandler,
		tagHandler,
		authService,
		mediaHandler,
		searchHandler,
		rateLimitMiddleware(loginLimiter),
	)

	// Применяем middleware
	var h http.Handler = mux
	h = rateLimitMiddleware(generalLimiter)(h)
	h = loggingMiddleware(h, log)
	h = securityHeadersMiddleware(h)
	h = corsMiddleware(h, cfg.CORS.AllowedOrigins)

	return h
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
	mediaHandler *handler.MediaHandler,
	searchHandler *handler.SearchHandler,
	loginLimit func(http.Handler) http.Handler,
) {
	// Health check
	mux.HandleFunc("GET /healthz", healthHandler(pool, log))

	// Auth (публичные)
	mux.Handle("POST /api/v1/auth/login", loginLimit(http.HandlerFunc(authHandler.Login)))
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

	// Media file (публичный) — ДО protectedHandler
	mux.HandleFunc("GET /api/v1/media/{id}/file", mediaHandler.GetFile)

	mux.HandleFunc("GET /api/v1/search", searchHandler.Search)
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

	// Media (защищённые) — ДО создания protectedHandler
	protectedMux.HandleFunc("POST /api/v1/media", mediaHandler.Upload)
	protectedMux.HandleFunc("GET /api/v1/media", mediaHandler.List)
	protectedMux.HandleFunc("DELETE /api/v1/media/{id}", mediaHandler.Delete)

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

	// Монтируем media маршруты
	mux.Handle("POST /api/v1/media", protectedHandler)
	mux.Handle("GET /api/v1/media", protectedHandler)
	mux.Handle("DELETE /api/v1/media/{id}", protectedHandler)
}
