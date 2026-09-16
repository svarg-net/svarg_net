package router

import (
	"net/http"
)

// registerAdminRoutes регистрирует защищённые маршруты
func registerAdminRoutes(mux *http.ServeMux, c *container) {
	// Mux 1: только авторизация (любой залогиненный)
	authOnlyMux := http.NewServeMux()
	authOnlyMux.HandleFunc("GET /api/v1/auth/me", c.authHandler.GetMe)

	// Mux 2: админские маршруты (только role=admin)
	adminOnlyMux := http.NewServeMux()

	// Posts
	adminOnlyMux.HandleFunc("POST /api/v1/posts", c.postHandler.CreatePost)
	adminOnlyMux.HandleFunc("PATCH /api/v1/posts/{id}", c.postHandler.UpdatePost)
	adminOnlyMux.HandleFunc("DELETE /api/v1/posts/{id}", c.postHandler.DeletePost)

	// Categories
	adminOnlyMux.HandleFunc("POST /api/v1/categories", c.categoryHandler.CreateCategory)
	adminOnlyMux.HandleFunc("PATCH /api/v1/categories/{id}", c.categoryHandler.UpdateCategory)
	adminOnlyMux.HandleFunc("DELETE /api/v1/categories/{id}", c.categoryHandler.DeleteCategory)

	// Tags
	adminOnlyMux.HandleFunc("POST /api/v1/tags", c.tagHandler.CreateTag)
	adminOnlyMux.HandleFunc("PATCH /api/v1/tags/{id}", c.tagHandler.UpdateTag)
	adminOnlyMux.HandleFunc("DELETE /api/v1/tags/{id}", c.tagHandler.DeleteTag)

	// Stats
	adminOnlyMux.HandleFunc("GET /api/v1/admin/stats", c.statsHandler.GetAdminStats)

	// Media
	adminOnlyMux.HandleFunc("POST /api/v1/media", c.mediaHandler.Upload)
	adminOnlyMux.HandleFunc("GET /api/v1/media", c.mediaHandler.List)
	adminOnlyMux.HandleFunc("DELETE /api/v1/media/{id}", c.mediaHandler.Delete)

	// Comments (модерация)
	adminOnlyMux.HandleFunc("GET /api/v1/admin/comments/pending", c.commentHandler.ListPending)
	adminOnlyMux.HandleFunc("GET /api/v1/admin/comments/count", c.commentHandler.CountPending)
	adminOnlyMux.HandleFunc("POST /api/v1/admin/comments/{id}/approve", c.commentHandler.Approve)
	adminOnlyMux.HandleFunc("POST /api/v1/admin/comments/{id}/reject", c.commentHandler.Reject)
	adminOnlyMux.HandleFunc("DELETE /api/v1/admin/comments/{id}", c.commentHandler.Delete)

	// Blocks
	adminOnlyMux.HandleFunc("GET /api/v1/admin/posts/{id}/blocks", c.blockHandler.ListForAdmin)
	adminOnlyMux.HandleFunc("POST /api/v1/admin/posts/{id}/blocks", c.blockHandler.Create)
	adminOnlyMux.HandleFunc("POST /api/v1/admin/posts/{id}/blocks/reorder", c.blockHandler.Reorder)
	adminOnlyMux.HandleFunc("POST /api/v1/admin/posts/{id}/convert-to-blocks", c.blockHandler.ConvertToBlocks)
	adminOnlyMux.HandleFunc("PATCH /api/v1/admin/blocks/{id}", c.blockHandler.Update)
	adminOnlyMux.HandleFunc("DELETE /api/v1/admin/blocks/{id}", c.blockHandler.Delete)

	// Polls
	adminOnlyMux.HandleFunc("GET /api/v1/admin/polls", c.pollHandler.ListAdmin)

	// Handler'ы с middleware
	authOnlyHandler := authMiddleware(authOnlyMux, c.authService, c.log)
	adminOnlyHandler := authMiddleware(requireAdmin(adminOnlyMux, c.log), c.authService, c.log)

	// Монтируем auth-only
	mux.Handle("GET /api/v1/auth/me", authOnlyHandler)

	// Монтируем admin-only
	mux.Handle("POST /api/v1/posts", adminOnlyHandler)
	mux.Handle("PATCH /api/v1/posts/{id}", adminOnlyHandler)
	mux.Handle("DELETE /api/v1/posts/{id}", adminOnlyHandler)
	mux.Handle("POST /api/v1/categories", adminOnlyHandler)
	mux.Handle("PATCH /api/v1/categories/{id}", adminOnlyHandler)
	mux.Handle("DELETE /api/v1/categories/{id}", adminOnlyHandler)
	mux.Handle("POST /api/v1/tags", adminOnlyHandler)
	mux.Handle("PATCH /api/v1/tags/{id}", adminOnlyHandler)
	mux.Handle("DELETE /api/v1/tags/{id}", adminOnlyHandler)
	mux.Handle("GET /api/v1/admin/stats", adminOnlyHandler)
	mux.Handle("POST /api/v1/media", adminOnlyHandler)
	mux.Handle("GET /api/v1/media", adminOnlyHandler)
	mux.Handle("DELETE /api/v1/media/{id}", adminOnlyHandler)
	mux.Handle("GET /api/v1/admin/comments/pending", adminOnlyHandler)
	mux.Handle("GET /api/v1/admin/comments/count", adminOnlyHandler)
	mux.Handle("POST /api/v1/admin/comments/{id}/approve", adminOnlyHandler)
	mux.Handle("POST /api/v1/admin/comments/{id}/reject", adminOnlyHandler)
	mux.Handle("DELETE /api/v1/admin/comments/{id}", adminOnlyHandler)
	mux.Handle("GET /api/v1/admin/posts/{id}/blocks", adminOnlyHandler)
	mux.Handle("POST /api/v1/admin/posts/{id}/blocks", adminOnlyHandler)
	mux.Handle("POST /api/v1/admin/posts/{id}/blocks/reorder", adminOnlyHandler)
	mux.Handle("POST /api/v1/admin/posts/{id}/convert-to-blocks", adminOnlyHandler)
	mux.Handle("PATCH /api/v1/admin/blocks/{id}", adminOnlyHandler)
	mux.Handle("DELETE /api/v1/admin/blocks/{id}", adminOnlyHandler)
	mux.Handle("GET /api/v1/admin/polls", adminOnlyHandler)
}
