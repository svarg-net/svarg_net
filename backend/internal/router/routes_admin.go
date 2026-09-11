package router

import (
	"net/http"
)

// registerAdminRoutes регистрирует защищённые маршруты (требуют access token)
func registerAdminRoutes(mux *http.ServeMux, c *container) {
	protectedMux := http.NewServeMux()

	// Auth
	protectedMux.HandleFunc("GET /api/v1/auth/me", c.authHandler.GetMe)

	// Posts
	protectedMux.HandleFunc("POST /api/v1/posts", c.postHandler.CreatePost)
	protectedMux.HandleFunc("PATCH /api/v1/posts/{id}", c.postHandler.UpdatePost)
	protectedMux.HandleFunc("DELETE /api/v1/posts/{id}", c.postHandler.DeletePost)

	// Categories
	protectedMux.HandleFunc("POST /api/v1/categories", c.categoryHandler.CreateCategory)
	protectedMux.HandleFunc("PATCH /api/v1/categories/{id}", c.categoryHandler.UpdateCategory)
	protectedMux.HandleFunc("DELETE /api/v1/categories/{id}", c.categoryHandler.DeleteCategory)

	// Tags
	protectedMux.HandleFunc("POST /api/v1/tags", c.tagHandler.CreateTag)
	protectedMux.HandleFunc("PATCH /api/v1/tags/{id}", c.tagHandler.UpdateTag)
	protectedMux.HandleFunc("DELETE /api/v1/tags/{id}", c.tagHandler.DeleteTag)

	// Stats
	protectedMux.HandleFunc("GET /api/v1/admin/stats", c.statsHandler.GetAdminStats)

	// Media
	protectedMux.HandleFunc("POST /api/v1/media", c.mediaHandler.Upload)
	protectedMux.HandleFunc("GET /api/v1/media", c.mediaHandler.List)
	protectedMux.HandleFunc("DELETE /api/v1/media/{id}", c.mediaHandler.Delete)

	// Comments (модерация)
	protectedMux.HandleFunc("GET /api/v1/admin/comments/pending", c.commentHandler.ListPending)
	protectedMux.HandleFunc("GET /api/v1/admin/comments/count", c.commentHandler.CountPending)
	protectedMux.HandleFunc("POST /api/v1/admin/comments/{id}/approve", c.commentHandler.Approve)
	protectedMux.HandleFunc("POST /api/v1/admin/comments/{id}/reject", c.commentHandler.Reject)
	protectedMux.HandleFunc("DELETE /api/v1/admin/comments/{id}", c.commentHandler.Delete)

	// Blocks
	protectedMux.HandleFunc("GET /api/v1/admin/posts/{id}/blocks", c.blockHandler.ListForAdmin)
	protectedMux.HandleFunc("POST /api/v1/admin/posts/{id}/blocks", c.blockHandler.Create)
	protectedMux.HandleFunc("POST /api/v1/admin/posts/{id}/blocks/reorder", c.blockHandler.Reorder)
	protectedMux.HandleFunc("POST /api/v1/admin/posts/{id}/convert-to-blocks", c.blockHandler.ConvertToBlocks)
	protectedMux.HandleFunc("PATCH /api/v1/admin/blocks/{id}", c.blockHandler.Update)
	protectedMux.HandleFunc("DELETE /api/v1/admin/blocks/{id}", c.blockHandler.Delete)

	// Применяем auth middleware
	var protectedHandler http.Handler = protectedMux
	protectedHandler = authMiddleware(protectedHandler, c.authService, c.log)

	// Монтируем все защищённые маршруты
	mux.Handle("GET /api/v1/auth/me", protectedHandler)
	mux.Handle("POST /api/v1/posts", protectedHandler)
	mux.Handle("PATCH /api/v1/posts/{id}", protectedHandler)
	mux.Handle("DELETE /api/v1/posts/{id}", protectedHandler)
	mux.Handle("POST /api/v1/categories", protectedHandler)
	mux.Handle("PATCH /api/v1/categories/{id}", protectedHandler)
	mux.Handle("DELETE /api/v1/categories/{id}", protectedHandler)
	mux.Handle("POST /api/v1/tags", protectedHandler)
	mux.Handle("PATCH /api/v1/tags/{id}", protectedHandler)
	mux.Handle("DELETE /api/v1/tags/{id}", protectedHandler)
	mux.Handle("GET /api/v1/admin/stats", protectedHandler)
	mux.Handle("POST /api/v1/media", protectedHandler)
	mux.Handle("GET /api/v1/media", protectedHandler)
	mux.Handle("DELETE /api/v1/media/{id}", protectedHandler)
	mux.Handle("GET /api/v1/admin/comments/pending", protectedHandler)
	mux.Handle("GET /api/v1/admin/comments/count", protectedHandler)
	mux.Handle("POST /api/v1/admin/comments/{id}/approve", protectedHandler)
	mux.Handle("POST /api/v1/admin/comments/{id}/reject", protectedHandler)
	mux.Handle("DELETE /api/v1/admin/comments/{id}", protectedHandler)
	mux.Handle("GET /api/v1/admin/posts/{id}/blocks", protectedHandler)
	mux.Handle("POST /api/v1/admin/posts/{id}/blocks", protectedHandler)
	mux.Handle("POST /api/v1/admin/posts/{id}/blocks/reorder", protectedHandler)
	mux.Handle("POST /api/v1/admin/posts/{id}/convert-to-blocks", protectedHandler)
	mux.Handle("PATCH /api/v1/admin/blocks/{id}", protectedHandler)
	mux.Handle("DELETE /api/v1/admin/blocks/{id}", protectedHandler)
}
