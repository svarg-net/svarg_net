package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"svarg_net/internal/logger"
	"svarg_net/internal/model"
	"svarg_net/internal/service"
)

type CommentHandler struct {
	commentService service.CommentService
	log            logger.Logger
}

func NewCommentHandler(commentService service.CommentService, log logger.Logger) *CommentHandler {
	return &CommentHandler{
		commentService: commentService,
		log:            log,
	}
}

// =========== Публичные эндпоинты ===========

// IssueToken GET /api/v1/posts/{slug}/comment-token
// Выдаёт одноразовый токен для отправки комментария.
func (h *CommentHandler) IssueToken(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")

	token, err := h.commentService.IssueToken(r.Context(), slug, r)
	if err != nil {
		h.log.Warn("issue token failed", "error", err, "slug", slug)
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"token": token})
}

// CreateComment POST /api/v1/comments
func (h *CommentHandler) CreateComment(w http.ResponseWriter, r *http.Request) {
	var req struct {
		PostID      int64  `json:"post_id"`
		ParentID    *int64 `json:"parent_id,omitempty"`
		AuthorName  string `json:"author_name"`
		AuthorEmail string `json:"author_email,omitempty"`
		Content     string `json:"content"`
		Token       string `json:"token"`
		Honeypot    string `json:"hp"` // скрытое поле
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	data := model.CommentCreateData{
		PostID:      req.PostID,
		ParentID:    req.ParentID,
		AuthorName:  req.AuthorName,
		AuthorEmail: &req.AuthorEmail,
		Content:     req.Content,
	}

	comment, err := h.commentService.CreateComment(r.Context(), data, req.Token, req.Honeypot, r)
	if err != nil {
		h.log.Warn("create comment failed", "error", err)
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"id":      comment.ID,
		"status":  comment.Status,
		"message": "Комментарий отправлен на модерацию. Он появится после проверки.",
	})
}

// GetComments GET /api/v1/posts/{slug}/comments
// Публичный эндпоинт — email удаляем из ответа.
func (h *CommentHandler) GetComments(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")

	tree, total, err := h.commentService.GetByPostID(r.Context(), slug)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	if tree == nil {
		tree = []model.Comment{}
	}

	// Обнуляем email и IPHash во всём дереве перед публичной отдачей
	stripPrivateFields(tree)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"items": tree,
		"total": total,
	})
}

// stripPrivateFields удаляет приватные поля (email, IP) из комментариев и их ответов.
func stripPrivateFields(comments []model.Comment) {
	for i := range comments {
		comments[i].AuthorEmail = nil
		comments[i].IPHash = ""
		if len(comments[i].Replies) > 0 {
			stripPrivateFields(comments[i].Replies)
		}
	}
}

// =========== Админские эндпоинты ===========

// ListPending GET /api/v1/admin/comments/pending?limit=50&offset=0
func (h *CommentHandler) ListPending(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	comments, err := h.commentService.ListPending(r.Context(), limit, offset)
	if err != nil {
		h.log.Error("list pending failed", "error", err)
		writeJSONError(w, http.StatusInternalServerError, "failed to load comments")
		return
	}

	if comments == nil {
		comments = []model.Comment{}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"items": comments})
}

// CountPending GET /api/v1/admin/comments/count
func (h *CommentHandler) CountPending(w http.ResponseWriter, r *http.Request) {
	count, err := h.commentService.CountPending(r.Context())
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "failed to count")
		return
	}

	writeJSON(w, http.StatusOK, map[string]int{"count": count})
}

// Approve POST /api/v1/admin/comments/{id}/approve
func (h *CommentHandler) Approve(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid id")
		return
	}

	if err := h.commentService.Approve(r.Context(), id); err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "approved"})
}

// Reject POST /api/v1/admin/comments/{id}/reject
func (h *CommentHandler) Reject(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid id")
		return
	}

	if err := h.commentService.Reject(r.Context(), id); err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "rejected"})
}

// Delete DELETE /api/v1/admin/comments/{id}
func (h *CommentHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid id")
		return
	}

	if err := h.commentService.Delete(r.Context(), id); err != nil {
		writeJSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// =========== Вспомогательные ===========

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeJSONError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
