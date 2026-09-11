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

// container хранит все зависимости приложения
type container struct {
	// Handlers
	postHandler     *handler.PostHandler
	authHandler     *handler.AuthHandler
	categoryHandler *handler.CategoryHandler
	tagHandler      *handler.TagHandler
	mediaHandler    *handler.MediaHandler
	searchHandler   *handler.SearchHandler
	statsHandler    *handler.StatsHandler
	commentHandler  *handler.CommentHandler
	blockHandler    *handler.BlockHandler

	// Services
	authService service.AuthService

	// Middleware
	loginLimiter   func(http.Handler) http.Handler
	commentLimiter func(http.Handler) http.Handler
	generalLimiter func(http.Handler) http.Handler

	// Logger
	log logger.Logger
}

// newContainer создаёт все зависимости приложения
func newContainer(
	pool *pgxpool.Pool,
	redisClient *redis.Client,
	cfg *config.Config,
	log logger.Logger,
) *container {
	// Repositories
	userRepo := repository.NewUserRepository(pool)
	categoryRepo := repository.NewCategoryRepository(pool)
	tagRepo := repository.NewTagRepository(pool)
	postRepo := repository.NewPostRepository(pool, tagRepo)
	refreshTokenRepo := repository.NewRefreshTokenRepository(pool)
	mediaRepo := repository.NewMediaRepository(pool)
	statsRepo := repository.NewStatsRepository(pool)
	commentRepo := repository.NewCommentRepository(pool)
	blockRepo := repository.NewBlockRepository(pool)

	// Services
	postService := service.NewPostService(postRepo, tagRepo, log)
	authService := service.NewAuthService(userRepo, refreshTokenRepo, cfg.JWT, log)
	categoryService := service.NewCategoryService(categoryRepo, log)
	tagService := service.NewTagService(tagRepo, log)
	mediaService := service.NewMediaService(mediaRepo, log)
	searchService := service.NewSearchService(postRepo, log)
	statsService := service.NewStatsService(statsRepo)
	commentService := service.NewCommentService(commentRepo, postRepo, redisClient, log)
	blockService := service.NewBlockService(blockRepo, postRepo, log)

	// Handlers
	return &container{
		postHandler:     handler.NewPostHandler(postService, categoryService, tagService, log),
		authHandler:     handler.NewAuthHandler(authService, cfg, log),
		categoryHandler: handler.NewCategoryHandler(categoryService, log),
		tagHandler:      handler.NewTagHandler(tagService, log),
		mediaHandler:    handler.NewMediaHandler(mediaService, log),
		searchHandler:   handler.NewSearchHandler(searchService, log),
		statsHandler:    handler.NewStatsHandler(statsService, log),
		commentHandler:  handler.NewCommentHandler(commentService, log),
		blockHandler:    handler.NewBlockHandler(blockService, log),
		authService:     authService,
		loginLimiter:    rateLimitMiddleware(newRateLimiterStore(rate.Every(time.Minute), 5)),
		commentLimiter:  rateLimitMiddleware(newRateLimiterStore(rate.Every(2*time.Minute), 2)),
		generalLimiter:  rateLimitMiddleware(newRateLimiterStore(rate.Limit(20), 40)),
		log:             log,
	}
}
