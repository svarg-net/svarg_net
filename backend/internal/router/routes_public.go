package router

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

// registerPublicRoutes регистрирует публичные маршруты
func registerPublicRoutes(mux *http.ServeMux, c *container, pool *pgxpool.Pool) {
	// Health check
	mux.HandleFunc("GET /healthz", healthHandler(pool, c.log))

	// Auth (публичные)
	mux.Handle("POST /api/v1/auth/login", c.loginLimiter(http.HandlerFunc(c.authHandler.Login)))
	mux.HandleFunc("POST /api/v1/auth/refresh", c.authHandler.Refresh)
	mux.HandleFunc("POST /api/v1/auth/logout", c.authHandler.Logout)

	// Публичные маршруты
	mux.HandleFunc("GET /api/v1/posts", c.postHandler.ListPosts)
	mux.HandleFunc("GET /api/v1/posts/{slug}", c.postHandler.GetPost)
	mux.HandleFunc("GET /api/v1/categories", c.categoryHandler.ListCategories)
	mux.HandleFunc("GET /api/v1/categories/{slug}", c.categoryHandler.GetCategory)
	mux.HandleFunc("GET /api/v1/categories/{slug}/posts", c.postHandler.ListPostsByCategory)
	mux.HandleFunc("GET /api/v1/tags", c.tagHandler.ListTags)
	mux.HandleFunc("GET /api/v1/tags/{slug}", c.tagHandler.GetTag)
	mux.HandleFunc("GET /api/v1/tags/{slug}/posts", c.postHandler.ListPostsByTag)

	// Media file (публичный)
	mux.HandleFunc("GET /api/v1/media/{id}/file", c.mediaHandler.GetFile)

	mux.HandleFunc("GET /api/v1/search", c.searchHandler.Search)
	mux.HandleFunc("GET /api/v1/posts/popular", c.statsHandler.ListPopular)
	mux.HandleFunc("POST /api/v1/posts/{slug}/view", c.statsHandler.RecordView)
	mux.HandleFunc("GET /api/v1/posts/{slug}/views", c.statsHandler.GetViews)

	// Комментарии (публичные)
	mux.HandleFunc("GET /api/v1/posts/{slug}/comments", c.commentHandler.GetComments)
	mux.HandleFunc("GET /api/v1/posts/{slug}/comment-token", c.commentHandler.IssueToken)
	mux.Handle("POST /api/v1/comments", c.commentLimiter(http.HandlerFunc(c.commentHandler.CreateComment)))

	// Блоки (публично)
	mux.HandleFunc("GET /api/v1/posts/{slug}/blocks", c.blockHandler.ListPublic)
}
