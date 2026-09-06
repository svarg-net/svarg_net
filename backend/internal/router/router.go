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
	"github.com/redis/go-redis/v9"
	"golang.org/x/time/rate"
)

// New создаёт и настраивает HTTP роутер
func New(cfg *config.Config, pool *pgxpool.Pool, log logger.Logger, redisClient *redis.Client) http.Handler {
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

	// Rate limiters
	generalLimiter := newRateLimiterStore(rate.Limit(20), 40)       // 20 rps, burst 40
	loginLimiter := newRateLimiterStore(rate.Every(time.Minute), 5) // 5 попыток логина в минуту
	// Комментарии: строго — 1 запрос / 2 минуты с IP, burst 2
	// Дополнительная защита к токену+honeypot
	commentLimiter := newRateLimiterStore(rate.Every(2*time.Minute), 2)

	searchService := service.NewSearchService(postRepo, log)
	searchHandler := handler.NewSearchHandler(searchService, log)

	statsRepo := repository.NewStatsRepository(pool)
	statsService := service.NewStatsService(statsRepo)
	statsHandler := handler.NewStatsHandler(statsService, log)

	// Комментарии
	commentRepo := repository.NewCommentRepository(pool)
	commentService := service.NewCommentService(commentRepo, postRepo, redisClient, log)
	commentHandler := handler.NewCommentHandler(commentService, log)

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
		statsHandler,
		commentHandler,
		rateLimitMiddleware(loginLimiter),
		rateLimitMiddleware(commentLimiter),
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
	statsHandler *handler.StatsHandler,
	commentHandler *handler.CommentHandler,
	loginLimit func(http.Handler) http.Handler,
	commentLimit func(http.Handler) http.Handler,
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

	// Media file (публичный)
	mux.HandleFunc("GET /api/v1/media/{id}/file", mediaHandler.GetFile)

	mux.HandleFunc("GET /api/v1/search", searchHandler.Search)
	mux.HandleFunc("GET /api/v1/posts/popular", statsHandler.ListPopular)
	mux.HandleFunc("POST /api/v1/posts/{slug}/view", statsHandler.RecordView)
	mux.HandleFunc("GET /api/v1/posts/{slug}/views", statsHandler.GetViews)

	// Комментарии (публичные)
	mux.HandleFunc("GET /api/v1/posts/{slug}/comments", commentHandler.GetComments)
	mux.HandleFunc("GET /api/v1/posts/{slug}/comment-token", commentHandler.IssueToken)
	mux.Handle("POST /api/v1/comments", commentLimit(http.HandlerFunc(commentHandler.CreateComment)))

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
	protectedMux.HandleFunc("GET /api/v1/admin/stats", statsHandler.GetAdminStats)

	// Media (защищённые)
	protectedMux.HandleFunc("POST /api/v1/media", mediaHandler.Upload)
	protectedMux.HandleFunc("GET /api/v1/media", mediaHandler.List)
	protectedMux.HandleFunc("DELETE /api/v1/media/{id}", mediaHandler.Delete)

	// Комментарии (админка — модерация)
	protectedMux.HandleFunc("GET /api/v1/admin/comments/pending", commentHandler.ListPending)
	protectedMux.HandleFunc("GET /api/v1/admin/comments/count", commentHandler.CountPending)
	protectedMux.HandleFunc("POST /api/v1/admin/comments/{id}/approve", commentHandler.Approve)
	protectedMux.HandleFunc("POST /api/v1/admin/comments/{id}/reject", commentHandler.Reject)
	protectedMux.HandleFunc("DELETE /api/v1/admin/comments/{id}", commentHandler.Delete)

	// Применяем auth middleware к защищённым маршрутам
	var protectedHandler http.Handler = protectedMux
	protectedHandler = authMiddleware(protectedHandler, authService, log)

	// Монтируем защищённые маршруты
	mux.Handle("GET /api/v1/admin/stats", protectedHandler)
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

	// Монтируем админские маршруты комментариев
	mux.Handle("GET /api/v1/admin/comments/pending", protectedHandler)
	mux.Handle("GET /api/v1/admin/comments/count", protectedHandler)
	mux.Handle("POST /api/v1/admin/comments/{id}/approve", protectedHandler)
	mux.Handle("POST /api/v1/admin/comments/{id}/reject", protectedHandler)
	mux.Handle("DELETE /api/v1/admin/comments/{id}", protectedHandler)
}
