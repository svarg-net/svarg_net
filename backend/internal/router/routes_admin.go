package router

import (
	"net/http"
)

// registerAdminRoutes регистрирует защищённые маршруты
func registerAdminRoutes(mux *http.ServeMux, c *container) {
	// Mux 1: только авторизация (любой залогиненный)
	authOnlyMux := http.NewServeMux()
	authOnlyMux.HandleFunc("GET /api/v1/auth/me", c.authHandler.GetMe)

        // Enrollments (auth-only, любой залогиненный)
        authOnlyMux.HandleFunc("POST /api/v1/courses/{slug}/enroll", c.enrollmentHandler.Enroll)
        authOnlyMux.HandleFunc("GET /api/v1/me/enrollments", c.enrollmentHandler.ListMyEnrollments)
        authOnlyMux.HandleFunc("GET /api/v1/courses/{id}/enrollment-status", c.enrollmentHandler.GetEnrollmentStatus)

        // Progress (auth-only)
        authOnlyMux.HandleFunc("POST /api/v1/lessons/{id}/complete", c.progressHandler.MarkComplete)
        authOnlyMux.HandleFunc("POST /api/v1/lessons/{id}/quiz", c.progressHandler.SubmitQuiz)
        authOnlyMux.HandleFunc("GET /api/v1/me/courses/{id}/progress", c.progressHandler.GetCourseProgress)
        authOnlyMux.HandleFunc("GET /api/v1/me/courses/{id}/lessons-progress", c.progressHandler.GetMyLessonsProgress)
        authOnlyMux.HandleFunc("GET /api/v1/lessons/{id}/progress", c.progressHandler.GetLessonProgress)

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

        // Enrollments (auth-only)
        mux.Handle("POST /api/v1/courses/{slug}/enroll", authOnlyHandler)
        mux.Handle("GET /api/v1/me/enrollments", authOnlyHandler)
        mux.Handle("GET /api/v1/courses/{id}/enrollment-status", authOnlyHandler)

        // Progress (auth-only)
        mux.Handle("POST /api/v1/lessons/{id}/complete", authOnlyHandler)
        mux.Handle("POST /api/v1/lessons/{id}/quiz", authOnlyHandler)
        mux.Handle("GET /api/v1/me/courses/{id}/progress", authOnlyHandler)
        mux.Handle("GET /api/v1/me/courses/{id}/lessons-progress", authOnlyHandler)
        mux.Handle("GET /api/v1/lessons/{id}/progress", authOnlyHandler)

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

	// === КУРСЫ И УРОКИ ===

	// Courses (админ)
	adminOnlyMux.HandleFunc("GET /api/v1/admin/courses", c.courseHandler.ListCoursesAdmin)
	adminOnlyMux.HandleFunc("GET /api/v1/admin/courses/{id}", c.courseHandler.GetCourseAdmin)
	adminOnlyMux.HandleFunc("POST /api/v1/admin/courses", c.courseHandler.CreateCourse)
	adminOnlyMux.HandleFunc("PATCH /api/v1/admin/courses/{id}", c.courseHandler.UpdateCourse)
	adminOnlyMux.HandleFunc("DELETE /api/v1/admin/courses/{id}", c.courseHandler.DeleteCourse)

	// Lessons (админ)
	adminOnlyMux.HandleFunc("GET /api/v1/admin/courses/{id}/lessons", c.lessonHandler.ListLessonsAdmin)
	adminOnlyMux.HandleFunc("POST /api/v1/admin/courses/{id}/lessons", c.lessonHandler.CreateLesson)
	adminOnlyMux.HandleFunc("POST /api/v1/admin/courses/{id}/lessons/reorder", c.lessonHandler.ReorderLessons)
	adminOnlyMux.HandleFunc("GET /api/v1/admin/lessons/{id}", c.lessonHandler.GetLessonAdmin)
	adminOnlyMux.HandleFunc("PATCH /api/v1/admin/lessons/{id}", c.lessonHandler.UpdateLesson)
	adminOnlyMux.HandleFunc("DELETE /api/v1/admin/lessons/{id}", c.lessonHandler.DeleteLesson)

	// Lesson Blocks (админ)
	adminOnlyMux.HandleFunc("GET /api/v1/admin/lessons/{id}/blocks", c.lessonHandler.ListLessonBlocks)
	adminOnlyMux.HandleFunc("POST /api/v1/admin/lessons/{id}/blocks", c.lessonHandler.CreateLessonBlock)
	adminOnlyMux.HandleFunc("POST /api/v1/admin/lessons/{id}/blocks/reorder", c.lessonHandler.ReorderLessonBlocks)
	adminOnlyMux.HandleFunc("PATCH /api/v1/admin/lesson-blocks/{id}", c.lessonHandler.UpdateLessonBlock)
	adminOnlyMux.HandleFunc("DELETE /api/v1/admin/lesson-blocks/{id}", c.lessonHandler.DeleteLessonBlock)

	// Монтируем курсы и уроки (admin-only)
	mux.Handle("GET /api/v1/admin/courses", adminOnlyHandler)
	mux.Handle("GET /api/v1/admin/courses/{id}", adminOnlyHandler)
	mux.Handle("POST /api/v1/admin/courses", adminOnlyHandler)
	mux.Handle("PATCH /api/v1/admin/courses/{id}", adminOnlyHandler)
	mux.Handle("DELETE /api/v1/admin/courses/{id}", adminOnlyHandler)
	mux.Handle("GET /api/v1/admin/courses/{id}/lessons", adminOnlyHandler)
	mux.Handle("POST /api/v1/admin/courses/{id}/lessons", adminOnlyHandler)
	mux.Handle("POST /api/v1/admin/courses/{id}/lessons/reorder", adminOnlyHandler)
	mux.Handle("GET /api/v1/admin/lessons/{id}", adminOnlyHandler)
	mux.Handle("PATCH /api/v1/admin/lessons/{id}", adminOnlyHandler)
	mux.Handle("DELETE /api/v1/admin/lessons/{id}", adminOnlyHandler)
	mux.Handle("GET /api/v1/admin/lessons/{id}/blocks", adminOnlyHandler)
	mux.Handle("POST /api/v1/admin/lessons/{id}/blocks", adminOnlyHandler)
	mux.Handle("POST /api/v1/admin/lessons/{id}/blocks/reorder", adminOnlyHandler)
	mux.Handle("PATCH /api/v1/admin/lesson-blocks/{id}", adminOnlyHandler)
	mux.Handle("DELETE /api/v1/admin/lesson-blocks/{id}", adminOnlyHandler)
}
