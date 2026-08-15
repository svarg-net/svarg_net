package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"svarg_net/internal/model"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// PostRepository интерфейс для работы с постами
type PostRepository interface {
	Create(ctx context.Context, req *model.PostCreateRequest, authorID int64) (*model.Post, error)
	GetByID(ctx context.Context, id int64) (*model.Post, error)
	GetBySlug(ctx context.Context, slug string) (*model.Post, error)
	List(ctx context.Context, status string, page, perPage int) (*model.PostListResponse, error)
	Update(ctx context.Context, id int64, req *model.PostUpdateRequest) (*model.Post, error)
	Delete(ctx context.Context, id int64) error
}

type postRepository struct {
	pool *pgxpool.Pool
}

// NewPostRepository создаёт новый репозиторий постов
func NewPostRepository(pool *pgxpool.Pool) PostRepository {
	return &postRepository{pool: pool}
}

func (r *postRepository) Create(ctx context.Context, req *model.PostCreateRequest, authorID int64) (*model.Post, error) {
	slug := generateSlug(req.Title)

	query := `
		INSERT INTO posts (author_id, slug, title, excerpt, content_md, content_json, status, published_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
		RETURNING id, author_id, slug, title, excerpt, content_md, content_json, status, published_at, created_at, updated_at
	`

	var post model.Post
	var publishedAt *time.Time

	if req.Status == model.PostStatusPublished {
		now := time.Now()
		publishedAt = &now
	}

	err := r.pool.QueryRow(ctx, query,
		authorID, slug, req.Title, req.Excerpt, req.ContentMD, req.ContentJSON, req.Status, publishedAt,
	).Scan(
		&post.ID, &post.AuthorID, &post.Slug, &post.Title, &post.Excerpt,
		&post.ContentMD, &post.ContentJSON, &post.Status, &post.PublishedAt,
		&post.CreatedAt, &post.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create post: %w", err)
	}

	return &post, nil
}

func (r *postRepository) GetByID(ctx context.Context, id int64) (*model.Post, error) {
	query := `
		SELECT id, author_id, slug, title, excerpt, content_md, content_json, status, published_at, created_at, updated_at
		FROM posts
		WHERE id = $1
	`

	var post model.Post
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&post.ID, &post.AuthorID, &post.Slug, &post.Title, &post.Excerpt,
		&post.ContentMD, &post.ContentJSON, &post.Status, &post.PublishedAt,
		&post.CreatedAt, &post.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("post not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get post: %w", err)
	}

	return &post, nil
}

func (r *postRepository) GetBySlug(ctx context.Context, slug string) (*model.Post, error) {
	query := `
		SELECT id, author_id, slug, title, excerpt, content_md, content_json, status, published_at, created_at, updated_at
		FROM posts
		WHERE slug = $1
	`

	var post model.Post
	err := r.pool.QueryRow(ctx, query, slug).Scan(
		&post.ID, &post.AuthorID, &post.Slug, &post.Title, &post.Excerpt,
		&post.ContentMD, &post.ContentJSON, &post.Status, &post.PublishedAt,
		&post.CreatedAt, &post.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("post not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get post: %w", err)
	}

	return &post, nil
}

func (r *postRepository) List(ctx context.Context, status string, page, perPage int) (*model.PostListResponse, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	offset := (page - 1) * perPage

	var query string
	var args []interface{}

	if status != "" {
		query = `
			SELECT id, author_id, slug, title, excerpt, content_md, content_json, status, published_at, created_at, updated_at
			FROM posts
			WHERE status = $1
			ORDER BY published_at DESC NULLS LAST, created_at DESC
			LIMIT $2 OFFSET $3
		`
		args = append(args, status, perPage, offset)
	} else {
		query = `
			SELECT id, author_id, slug, title, excerpt, content_md, content_json, status, published_at, created_at, updated_at
			FROM posts
			ORDER BY published_at DESC NULLS LAST, created_at DESC
			LIMIT $1 OFFSET $2
		`
		args = append(args, perPage, offset)
	}

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list posts: %w", err)
	}
	defer rows.Close()

	var posts []model.Post
	for rows.Next() {
		var post model.Post
		err := rows.Scan(
			&post.ID, &post.AuthorID, &post.Slug, &post.Title, &post.Excerpt,
			&post.ContentMD, &post.ContentJSON, &post.Status, &post.PublishedAt,
			&post.CreatedAt, &post.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan post: %w", err)
		}
		posts = append(posts, post)
	}
	if posts == nil {
		posts = []model.Post{}
	}
	var countQuery string
	var countArgs []interface{}

	if status != "" {
		countQuery = `SELECT COUNT(*) FROM posts WHERE status = $1`
		countArgs = append(countArgs, status)
	} else {
		countQuery = `SELECT COUNT(*) FROM posts`
	}

	var total int
	err = r.pool.QueryRow(ctx, countQuery, countArgs...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count posts: %w", err)
	}

	return &model.PostListResponse{
		Items:   posts,
		Total:   total,
		Page:    page,
		PerPage: perPage,
	}, nil
}

func (r *postRepository) Update(ctx context.Context, id int64, req *model.PostUpdateRequest) (*model.Post, error) {
	var setParts []string
	var args []interface{}
	argIndex := 1

	if req.Title != nil {
		setParts = append(setParts, fmt.Sprintf("title = $%d", argIndex))
		args = append(args, *req.Title)
		argIndex++
	}

	if req.Excerpt != nil {
		setParts = append(setParts, fmt.Sprintf("excerpt = $%d", argIndex))
		args = append(args, *req.Excerpt)
		argIndex++
	}

	if req.ContentMD != nil {
		setParts = append(setParts, fmt.Sprintf("content_md = $%d", argIndex))
		args = append(args, *req.ContentMD)
		argIndex++
	}

	if req.ContentJSON != nil {
		setParts = append(setParts, fmt.Sprintf("content_json = $%d", argIndex))
		args = append(args, *req.ContentJSON)
		argIndex++
	}

	if req.Status != nil {
		setParts = append(setParts, fmt.Sprintf("status = $%d", argIndex))
		args = append(args, *req.Status)
		argIndex++

		if *req.Status == model.PostStatusPublished {
			setParts = append(setParts, fmt.Sprintf("published_at = COALESCE(published_at, $%d)", argIndex))
			args = append(args, time.Now())
			argIndex++
		}
	}

	if len(setParts) == 0 {
		return r.GetByID(ctx, id)
	}

	setParts = append(setParts, "updated_at = now()")

	query := fmt.Sprintf(`
		UPDATE posts
		SET %s
		WHERE id = $%d
		RETURNING id, author_id, slug, title, excerpt, content_md, content_json, status, published_at, created_at, updated_at
	`, strings.Join(setParts, ", "), argIndex)

	args = append(args, id)

	var post model.Post
	err := r.pool.QueryRow(ctx, query, args...).Scan(
		&post.ID, &post.AuthorID, &post.Slug, &post.Title, &post.Excerpt,
		&post.ContentMD, &post.ContentJSON, &post.Status, &post.PublishedAt,
		&post.CreatedAt, &post.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("post not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update post: %w", err)
	}

	return &post, nil
}

func (r *postRepository) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM posts WHERE id = $1`
	result, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete post: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("post not found")
	}

	return nil
}

func generateSlug(title string) string {
	slug := strings.ToLower(title)
	slug = strings.ReplaceAll(slug, " ", "-")
	return fmt.Sprintf("%s-%d", slug, time.Now().Unix())
}
