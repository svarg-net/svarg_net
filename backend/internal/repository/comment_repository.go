package repository

import (
	"context"
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"svarg_net/internal/model"
)

type CommentRepository interface {
	Create(ctx context.Context, data model.CommentCreateData, ipHash string) (*model.Comment, error)
	GetByPostID(ctx context.Context, postID int64, onlyApproved bool) ([]model.Comment, error)
	GetByID(ctx context.Context, id int64) (*model.Comment, error)
	ListPending(ctx context.Context, limit, offset int) ([]model.Comment, error)
	CountPending(ctx context.Context) (int, error)
	UpdateStatus(ctx context.Context, id int64, status string) error
	Delete(ctx context.Context, id int64) error
	CommentsEnabled(ctx context.Context, postID int64) (bool, error)
}

type commentRepository struct {
	pool *pgxpool.Pool
}

func NewCommentRepository(pool *pgxpool.Pool) CommentRepository {
	return &commentRepository{pool: pool}
}

func (r *commentRepository) Create(ctx context.Context, data model.CommentCreateData, ipHash string) (*model.Comment, error) {
	var id int64
	var createdAt, updatedAt time.Time

	err := r.pool.QueryRow(ctx, `
		INSERT INTO comments (post_id, parent_id, author_name, author_email, content, status, ip_hash)
		VALUES ($1, $2, $3, $4, $5, 'pending', $6)
		RETURNING id, created_at, updated_at
	`, data.PostID, data.ParentID, data.AuthorName, nullString(*data.AuthorEmail), data.Content, ipHash).
		Scan(&id, &createdAt, &updatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create comment: %w", err)
	}

	comment := &model.Comment{
		ID:         id,
		PostID:     data.PostID,
		ParentID:   data.ParentID,
		AuthorName: data.AuthorName,
		Content:    data.Content,
		Status:     model.CommentStatusPending,
		IPHash:     ipHash,
		CreatedAt:  createdAt,
		UpdatedAt:  updatedAt,
	}

	if data.AuthorEmail != nil && *data.AuthorEmail != "" {
		email := strings.ToLower(strings.TrimSpace(*data.AuthorEmail))
		hash := md5.Sum([]byte(email))
		comment.GravatarID = hex.EncodeToString(hash[:])
	}

	return comment, nil
}

func (r *commentRepository) GetByPostID(ctx context.Context, postID int64, onlyApproved bool) ([]model.Comment, error) {
	query := `
		SELECT id, post_id, parent_id, author_name, author_email, content, status, ip_hash, created_at, updated_at
		FROM comments
		WHERE post_id = $1
	`
	if onlyApproved {
		query += " AND status = 'approved'"
	}
	query += " ORDER BY created_at ASC"

	rows, err := r.pool.Query(ctx, query, postID)
	if err != nil {
		return nil, fmt.Errorf("failed to query comments: %w", err)
	}
	defer rows.Close()

	var comments []model.Comment
	for rows.Next() {
		var c model.Comment
		var authorEmail *string
		err := rows.Scan(
			&c.ID, &c.PostID, &c.ParentID, &c.AuthorName, &authorEmail,
			&c.Content, &c.Status, &c.IPHash, &c.CreatedAt, &c.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan comment: %w", err)
		}

		if authorEmail != nil && *authorEmail != "" {
			email := strings.ToLower(strings.TrimSpace(*authorEmail))
			hash := md5.Sum([]byte(email))
			c.GravatarID = hex.EncodeToString(hash[:])
		}

		comments = append(comments, c)
	}

	return comments, nil
}

func (r *commentRepository) GetByID(ctx context.Context, id int64) (*model.Comment, error) {
	var c model.Comment
	var authorEmail *string

	err := r.pool.QueryRow(ctx, `
		SELECT id, post_id, parent_id, author_name, author_email, content, status, ip_hash, created_at, updated_at
		FROM comments
		WHERE id = $1
	`, id).Scan(
		&c.ID, &c.PostID, &c.ParentID, &c.AuthorName, &authorEmail,
		&c.Content, &c.Status, &c.IPHash, &c.CreatedAt, &c.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get comment: %w", err)
	}

	if authorEmail != nil && *authorEmail != "" {
		email := strings.ToLower(strings.TrimSpace(*authorEmail))
		hash := md5.Sum([]byte(email))
		c.GravatarID = hex.EncodeToString(hash[:])
	}

	return &c, nil
}

func (r *commentRepository) ListPending(ctx context.Context, limit, offset int) ([]model.Comment, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT c.id, c.post_id, c.parent_id, c.author_name, c.author_email, c.content, c.status, c.ip_hash, c.created_at, c.updated_at,
		       p.title AS post_title
		FROM comments c
		JOIN posts p ON p.id = c.post_id
		WHERE c.status = 'pending'
		ORDER BY c.created_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)

	if err != nil {
		return nil, fmt.Errorf("failed to query pending comments: %w", err)
	}
	defer rows.Close()

	var comments []model.Comment
	for rows.Next() {
		var c model.Comment
		var authorEmail *string
		var postTitle string
		err := rows.Scan(
			&c.ID, &c.PostID, &c.ParentID, &c.AuthorName, &authorEmail,
			&c.Content, &c.Status, &c.IPHash, &c.CreatedAt, &c.UpdatedAt,
			&postTitle,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan pending comment: %w", err)
		}

		if authorEmail != nil && *authorEmail != "" {
			email := strings.ToLower(strings.TrimSpace(*authorEmail))
			hash := md5.Sum([]byte(email))
			c.GravatarID = hex.EncodeToString(hash[:])
		}

		comments = append(comments, c)
	}

	return comments, nil
}

func (r *commentRepository) CountPending(ctx context.Context) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM comments WHERE status = 'pending'`).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count pending comments: %w", err)
	}
	return count, nil
}

func (r *commentRepository) UpdateStatus(ctx context.Context, id int64, status string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE comments
		SET status = $1, updated_at = now()
		WHERE id = $2
	`, status, id)

	if err != nil {
		return fmt.Errorf("failed to update comment status: %w", err)
	}
	return nil
}

func (r *commentRepository) Delete(ctx context.Context, id int64) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM comments WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("failed to delete comment: %w", err)
	}
	return nil
}

func (r *commentRepository) CommentsEnabled(ctx context.Context, postID int64) (bool, error) {
	var enabled bool
	err := r.pool.QueryRow(ctx, `SELECT comments_enabled FROM posts WHERE id = $1`, postID).Scan(&enabled)
	if err == pgx.ErrNoRows {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("failed to check comments_enabled: %w", err)
	}
	return enabled, nil
}

func nullString(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
