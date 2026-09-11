package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"svarg_net/internal/model"

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
	Search(ctx context.Context, query string, status string, limit, offset int) ([]*model.Post, error)
	UpdateContentMode(ctx context.Context, id int64, mode string) error
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

	var publishedAt *time.Time
	if req.Status == model.PostStatusPublished {
		now := time.Now()
		publishedAt = &now
	}

	commentsEnabled := true
	if req.CommentsEnabled != nil {
		commentsEnabled = *req.CommentsEnabled
	}

	post, err := scanPost(r.pool.QueryRow(ctx, `
		INSERT INTO posts (
			author_id, slug, title, excerpt, content_md, content_json, status, published_at, created_at, updated_at,
			meta_title, meta_description, meta_keywords, og_image, category_id, comments_enabled
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now(), $9, $10, $11, $12, $13, $14)
		RETURNING `+postColumns,
		authorID, slug, req.Title, req.Excerpt, req.ContentMD, req.ContentJSON, req.Status, publishedAt,
		req.MetaTitle, req.MetaDescription, req.MetaKeywords, req.OGImage, req.CategoryID, commentsEnabled,
	))
	if err != nil {
		return nil, fmt.Errorf("failed to create post: %w", err)
	}
	if post == nil {
		return nil, fmt.Errorf("failed to create post: no row returned")
	}
	return post, nil
}

func (r *postRepository) GetByID(ctx context.Context, id int64) (*model.Post, error) {
	return scanPost(r.pool.QueryRow(ctx,
		`SELECT `+postColumns+` FROM posts WHERE id = $1`, id))
}

func (r *postRepository) GetBySlug(ctx context.Context, slug string) (*model.Post, error) {
	post, err := scanPost(r.pool.QueryRow(ctx,
		`SELECT `+postColumns+` FROM posts WHERE slug = $1`, slug))
	if err != nil {
		return nil, err
	}
	if post == nil {
		return nil, fmt.Errorf("post not found")
	}
	return post, nil
}

func (r *postRepository) List(ctx context.Context, status string, page, perPage int) (*model.PostListResponse, error) {
	page, perPage, offset := normalizePage(page, perPage)

	var query string
	var args []interface{}

	if status != "" {
		query = `SELECT ` + postColumns + ` FROM posts
			WHERE status = $1
			ORDER BY published_at DESC NULLS LAST, created_at DESC
			LIMIT $2 OFFSET $3`
		args = append(args, status, perPage, offset)
	} else {
		query = `SELECT ` + postColumns + ` FROM posts
			ORDER BY published_at DESC NULLS LAST, created_at DESC
			LIMIT $1 OFFSET $2`
		args = append(args, perPage, offset)
	}

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list posts: %w", err)
	}

	posts, err := scanPosts(rows)
	if err != nil {
		return nil, err
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
	if err := r.pool.QueryRow(ctx, countQuery, countArgs...).Scan(&total); err != nil {
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

func (r *postRepository) ListByCategory(ctx context.Context, categoryID int64, status string, page, perPage int) (*model.PostListResponse, error) {
	page, perPage, offset := normalizePage(page, perPage)

	rows, err := r.pool.Query(ctx, `
		SELECT `+postColumns+` FROM posts
		WHERE category_id = $1 AND status = $2
		ORDER BY published_at DESC NULLS LAST, created_at DESC
		LIMIT $3 OFFSET $4`,
		categoryID, status, perPage, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list posts by category: %w", err)
	}

	posts, err := scanPosts(rows)
	if err != nil {
		return nil, err
	}

	var total int
	if err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM posts WHERE category_id = $1 AND status = $2`,
		categoryID, status).Scan(&total); err != nil {
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
	page, perPage, offset := normalizePage(page, perPage)

	rows, err := r.pool.Query(ctx, `
		SELECT p.id, p.author_id, p.slug, p.title, p.excerpt, p.content_md, p.content_json,
			p.status, p.published_at, p.created_at, p.updated_at,
			COALESCE(p.meta_title, ''), COALESCE(p.meta_description, ''), COALESCE(p.meta_keywords, '{}'), COALESCE(p.og_image, ''),
			p.category_id, p.comments_enabled, p.views_count, p.content_mode
		FROM posts p
		JOIN post_tags pt ON p.id = pt.post_id
		WHERE pt.tag_id = $1 AND p.status = $2
		ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC
		LIMIT $3 OFFSET $4`,
		tagID, status, perPage, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list posts by tag: %w", err)
	}

	posts, err := scanPosts(rows)
	if err != nil {
		return nil, err
	}

	var total int
	if err := r.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM posts p
		JOIN post_tags pt ON p.id = pt.post_id
		WHERE pt.tag_id = $1 AND p.status = $2`,
		tagID, status).Scan(&total); err != nil {
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

	if req.CategoryID != nil {
		setParts = append(setParts, fmt.Sprintf("category_id = $%d", argIndex))
		args = append(args, *req.CategoryID)
		argIndex++
	}

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

	if req.CommentsEnabled != nil {
		setParts = append(setParts, fmt.Sprintf("comments_enabled = $%d", argIndex))
		args = append(args, *req.CommentsEnabled)
		argIndex++
	}

	if len(setParts) == 0 {
		return r.GetByID(ctx, id)
	}

	setParts = append(setParts, "updated_at = now()")
	args = append(args, id)

	post, err := scanPost(r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE posts SET %s WHERE id = $%d RETURNING `+postColumns,
			strings.Join(setParts, ", "), argIndex),
		args...))
	if err != nil {
		return nil, fmt.Errorf("failed to update post: %w", err)
	}
	if post == nil {
		return nil, fmt.Errorf("post not found")
	}
	return post, nil
}

func (r *postRepository) Delete(ctx context.Context, id int64) error {
	result, err := r.pool.Exec(ctx, `DELETE FROM posts WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("failed to delete post: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("post not found")
	}
	return nil
}

func (r *postRepository) Search(ctx context.Context, query string, status string, limit, offset int) ([]*model.Post, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT `+postColumns+`
		FROM posts p
		WHERE p.search_vector @@ plainto_tsquery('russian', $1)
		  AND ($2 = '' OR p.status = $2)
		ORDER BY ts_rank_cd(p.search_vector, plainto_tsquery('russian', $1)) DESC
		LIMIT $3 OFFSET $4`,
		query, status, limit, offset)
	if err != nil {
		return nil, err
	}

	posts, err := scanPosts(rows)
	if err != nil {
		return nil, err
	}

	results := make([]*model.Post, 0, len(posts))
	for i := range posts {
		p := posts[i]
		// Загружаем теги отдельным запросом
		tags, err := r.tagRepo.GetPostTags(ctx, p.ID)
		if err == nil {
			p.Tags = tags
		}
		results = append(results, &p)
	}

	return results, nil
}

func (r *postRepository) UpdateContentMode(ctx context.Context, id int64, mode string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE posts SET content_mode = $1, updated_at = now() WHERE id = $2`,
		mode, id)
	if err != nil {
		return fmt.Errorf("failed to update content_mode: %w", err)
	}
	return nil
}

// generateSlug генерирует slug из заголовка с unix-суффиксом
func generateSlug(title string) string {
	slug := strings.ToLower(title)
	slug = strings.ReplaceAll(slug, " ", "-")
	return fmt.Sprintf("%s-%d", slug, time.Now().Unix())
}

// normalizePage приводит пагинацию к валидным значениям
func normalizePage(page, perPage int) (int, int, int) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	return page, perPage, (page - 1) * perPage
}
