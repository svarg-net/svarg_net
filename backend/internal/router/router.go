package router

import (
	"net/http"

	"svarg_net/internal/config"
	"svarg_net/internal/logger"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

// RouterBuilder строит HTTP роутер через fluent API
type RouterBuilder struct {
	pool        *pgxpool.Pool
	redisClient *redis.Client
	cfg         *config.Config
	log         logger.Logger
	container   *container
}

// New создаёт новый RouterBuilder
func New(
	cfg *config.Config,
	pool *pgxpool.Pool,
	log logger.Logger,
	redisClient *redis.Client,
) *RouterBuilder {
	return &RouterBuilder{
		pool:        pool,
		redisClient: redisClient,
		cfg:         cfg,
		log:         log,
	}
}

// Build создаёт и настраивает HTTP роутер
func (b *RouterBuilder) Build() http.Handler {
	// Создаём контейнер зависимостей
	b.container = newContainer(b.pool, b.redisClient, b.cfg, b.log)

	mux := http.NewServeMux()

	// Регистрируем маршруты
	registerPublicRoutes(mux, b.container, b.pool)
	registerAdminRoutes(mux, b.container)

	// Применяем middleware
	var h http.Handler = mux
	h = b.container.generalLimiter(h)
	h = loggingMiddleware(h, b.log)
	h = securityHeadersMiddleware(h)
	h = corsMiddleware(h, b.cfg.CORS.AllowedOrigins)

	return h
}
