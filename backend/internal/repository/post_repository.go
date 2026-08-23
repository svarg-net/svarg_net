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
	ListByCategory(ctx context.Context, categoryID int64, status string, page, perPage int) (*model.PostListResponse, error)
	ListByTag(ctx context.Context, tagID int64, status string, page, perPage int) (*model.PostListResponse, error)
	Update(ctx context.Context, id int64, req *model.PostUpdateRequest) (*model.Post, error)
	Delete(ctx context.Context, id int64) error
}

type postRepository struct {
	pool    *pgxpool.Pool
	tagRepo TagRepository
}

// NewPostRepository создаёт новый репозиторий постов
func NewPostRepository(pool *pgxpool.Pool, tagRepo TagRepository) PostRepository {
	return &postRepository{pool: pool, tagRepo: tagRepo}
}

func (r *postRepository) Create(ctx context.Context, req *model.PostCreateRequest, authorID int64) (*model.Post, error) {
	slug := generateSlug(req.Title)

	query := `
		INSERT INTO posts (
			author_id, slug, title, excerpt, content_md, content_json, status, published_at, created_at, updated_at,
			meta_title, meta_description, meta_keywords, og_image, category_id
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now(), $9, $10, $11, $12, $13)
		RETURNING id, author_id, slug, title, excerpt, content_md, content_json, status, published_at, created_at, updated_at,
			COALESCE(meta_title, ''), COALESCE(meta_description, ''), COALESCE(meta_keywords, '{}'), COALESCE(og_image, ''), category_id
	`

	var post model.Post
	var publishedAt *time.Time

	if req.Status == model.PostStatusPublished {
		now := time.Now()
		publishedAt = &now
	}

	err := r.pool.QueryRow(ctx, query,
		authorID, slug, req.Title, req.Excerpt, req.ContentMD, req.ContentJSON, req.Status, publishedAt,
		req.MetaTitle, req.MetaDescription, req.MetaKeywords, req.OGImage, req.CategoryID,
	).Scan(
		&post.ID, &post.AuthorID, &post.Slug, &post.Title, &post.Excerpt,
		&post.ContentMD, &post.ContentJSON, &post.Status, &post.PublishedAt,
		&post.CreatedAt, &post.UpdatedAt,
		&post.MetaTitle, &post.MetaDescription, &post.MetaKeywords, &post.OGImage,
		&post.CategoryID,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create post: %w", err)
	}

	return &post, nil
}

func (r *postRepository) GetByID(ctx context.Context, id int64) (*model.Post, error) {
	query := `
		SELECT id, author_id, slug, title, excerpt, content_md, content_json, status, published_at, created_at, updated_at,
			COALESCE(meta_title, ''), COALESCE(meta_description, ''), COALESCE(meta_keywords, '{}'), COALESCE(og_image, ''), category_id
		FROM posts
		WHERE id = $1
	`

	var post model.Post
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&post.ID, &post.AuthorID, &post.Slug, &post.Title, &post.Excerpt,
		&post.ContentMD, &post.ContentJSON, &post.Status, &post.PublishedAt,
		&post.CreatedAt, &post.UpdatedAt,
		&post.MetaTitle, &post.MetaDescription, &post.MetaKeywords, &post.OGImage,
		&post.CategoryID,
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
		SELECT id, author_id, slug, title, excerpt, content_md, content_json, status, published_at, created_at, updated_at,
			COALESCE(meta_title, ''), COALESCE(meta_description, ''), COALESCE(meta_keywords, '{}'), COALESCE(og_image, ''),category_id
		FROM posts
		WHERE slug = $1
	`

	var post model.Post
	err := r.pool.QueryRow(ctx, query, slug).Scan(
		&post.ID, &post.AuthorID, &post.Slug, &post.Title, &post.Excerpt,
		&post.ContentMD, &post.ContentJSON, &post.Status, &post.PublishedAt,
		&post.CreatedAt, &post.UpdatedAt,
		&post.MetaTitle, &post.MetaDescription, &post.MetaKeywords, &post.OGImage,
		&post.CategoryID,
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
			SELECT id, author_id, slug, title, excerpt, content_md, content_json, status, published_at, created_at, updated_at,
				COALESCE(meta_title, ''), COALESCE(meta_description, ''), COALESCE(meta_keywords, '{}'), COALESCE(og_image, ''), category_id
			FROM posts
			WHERE status = $1
			ORDER BY published_at DESC NULLS LAST, created_at DESC
			LIMIT $2 OFFSET $3
		`
		args = append(args, status, perPage, offset)
	} else {
		query = `
			SELECT id, author_id, slug, title, excerpt, content_md, content_json, status, published_at, created_at, updated_at,
				COALESCE(meta_title, ''), COALESCE(meta_description, ''), COALESCE(meta_keywords, '{}'), COALESCE(og_image, ''), category_id
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
			&post.MetaTitle, &post.MetaDescription, &post.MetaKeywords, &post.OGImage,
			&post.CategoryID,
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
	// Загружаем теги для каждого поста
	for i := range posts {
		tags, err := r.tagRepo.GetPostTags(ctx, posts[i].ID)
		if err == nil {
			posts[i].Tags = tags
		}
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
	// Категория
	// Категория
	if req.CategoryID != nil {
		setParts = append(setParts, fmt.Sprintf("category_id = $%d", argIndex))
		args = append(args, *req.CategoryID)
		argIndex++
	}

	// Мета-информация
	if req.MetaTitle != nil {
		setParts = append(setParts, fmt.Sprintf("meta_title = $%d", argIndex))
		args = append(args, *req.MetaTitle)
		argIndex++
	}

	if req.MetaDescription != nil {
		setParts = append(setParts, fmt.Sprintf("meta_description = $%d", argIndex))
		args = append(args, *req.MetaDescription)
		argIndex++
	}

	if req.MetaKeywords != nil {
		setParts = append(setParts, fmt.Sprintf("meta_keywords = $%d", argIndex))
		args = append(args, *req.MetaKeywords)
		argIndex++
	}

	if req.OGImage != nil {
		setParts = append(setParts, fmt.Sprintf("og_image = $%d", argIndex))
		args = append(args, *req.OGImage)
		argIndex++
	}

	if len(setParts) == 0 {
		return r.GetByID(ctx, id)
	}

	setParts = append(setParts, "updated_at = now()")

	query := fmt.Sprintf(`
    UPDATE posts
    SET %s
    WHERE id = $%d
    RETURNING id, author_id, slug, title, excerpt, content_md, content_json, status, published_at, created_at, updated_at,
        COALESCE(meta_title, ''), COALESCE(meta_description, ''), COALESCE(meta_keywords, '{}'), COALESCE(og_image, ''), category_id
`, strings.Join(setParts, ", "), argIndex)

	args = append(args, id)

	var post model.Post
	err := r.pool.QueryRow(ctx, query, args...).Scan(
		&post.ID, &post.AuthorID, &post.Slug, &post.Title, &post.Excerpt,
		&post.ContentMD, &post.ContentJSON, &post.Status, &post.PublishedAt,
		&post.CreatedAt, &post.UpdatedAt,
		&post.MetaTitle, &post.MetaDescription, &post.MetaKeywords, &post.OGImage,
		&post.CategoryID,
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

func (r *postRepository) ListByCategory(ctx context.Context, categoryID int64, status string, page, perPage int) (*model.PostListResponse, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	offset := (page - 1) * perPage

	query := `
		SELECT id, author_id, slug, title, excerpt, content_md, content_json, status, published_at, created_at, updated_at,
			COALESCE(meta_title, ''), COALESCE(meta_description, ''), COALESCE(meta_keywords, '{}'), COALESCE(og_image, '')
		FROM posts
		WHERE category_id = $1 AND status = $2
		ORDER BY published_at DESC NULLS LAST, created_at DESC
		LIMIT $3 OFFSET $4
	`

	rows, err := r.pool.Query(ctx, query, categoryID, status, perPage, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list posts by category: %w", err)
	}
	defer rows.Close()

	var posts []model.Post
	for rows.Next() {
		var post model.Post
		err := rows.Scan(
			&post.ID, &post.AuthorID, &post.Slug, &post.Title, &post.Excerpt,
			&post.ContentMD, &post.ContentJSON, &post.Status, &post.PublishedAt,
			&post.CreatedAt, &post.UpdatedAt,
			&post.MetaTitle, &post.MetaDescription, &post.MetaKeywords, &post.OGImage,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan post: %w", err)
		}
		posts = append(posts, post)
	}

	if posts == nil {
		posts = []model.Post{}
	}

	var total int
	err = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM posts WHERE category_id = $1 AND status = $2`, categoryID, status).Scan(&total)
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

func (r *postRepository) ListByTag(ctx context.Context, tagID int64, status string, page, perPage int) (*model.PostListResponse, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	offset := (page - 1) * perPage

	query := `
		SELECT p.id, p.author_id, p.slug, p.title, p.excerpt, p.content_md, p.content_json, p.status, p.published_at, p.created_at, p.updated_at,
			COALESCE(p.meta_title, ''), COALESCE(p.meta_description, ''), COALESCE(p.meta_keywords, '{}'), COALESCE(p.og_image, '')
		FROM posts p
		JOIN post_tags pt ON p.id = pt.post_id
		WHERE pt.tag_id = $1 AND p.status = $2
		ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC
		LIMIT $3 OFFSET $4
	`

	rows, err := r.pool.Query(ctx, query, tagID, status, perPage, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list posts by tag: %w", err)
	}
	defer rows.Close()

	var posts []model.Post
	for rows.Next() {
		var post model.Post
		err := rows.Scan(
			&post.ID, &post.AuthorID, &post.Slug, &post.Title, &post.Excerpt,
			&post.ContentMD, &post.ContentJSON, &post.Status, &post.PublishedAt,
			&post.CreatedAt, &post.UpdatedAt,
			&post.MetaTitle, &post.MetaDescription, &post.MetaKeywords, &post.OGImage,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan post: %w", err)
		}
		posts = append(posts, post)
	}

	if posts == nil {
		posts = []model.Post{}
	}

	var total int
	err = r.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM posts p
		JOIN post_tags pt ON p.id = pt.post_id
		WHERE pt.tag_id = $1 AND p.status = $2
	`, tagID, status).Scan(&total)
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
