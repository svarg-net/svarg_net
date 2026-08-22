package repository

import (
	"context"
	"fmt"
	"strings"

	"svarg_net/internal/model"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// TagRepository интерфейс для работы с тегами
type TagRepository interface {
	Create(ctx context.Context, req *model.TagCreateRequest) (*model.Tag, error)
	GetByID(ctx context.Context, id int64) (*model.Tag, error)
	GetBySlug(ctx context.Context, slug string) (*model.Tag, error)
	List(ctx context.Context) (*model.TagListResponse, error)
	Update(ctx context.Context, id int64, req *model.TagUpdateRequest) (*model.Tag, error)
	Delete(ctx context.Context, id int64) error
	AddToPost(ctx context.Context, postID, tagID int64) error
	RemoveFromPost(ctx context.Context, postID, tagID int64) error
	GetPostTags(ctx context.Context, postID int64) ([]model.Tag, error)
	SetPostTags(ctx context.Context, postID int64, tagIDs []int64) error
}

type tagRepository struct {
	pool *pgxpool.Pool
}

// NewTagRepository создаёт новый репозиторий тегов
func NewTagRepository(pool *pgxpool.Pool) TagRepository {
	return &tagRepository{pool: pool}
}

func (r *tagRepository) Create(ctx context.Context, req *model.TagCreateRequest) (*model.Tag, error) {
	slug := generateSlug(req.Name)

	query := `
		INSERT INTO tags (name, slug, created_at, meta_title, meta_description, og_image)
		VALUES ($1, $2, now(), $3, $4, $5)
		RETURNING id, name, slug, created_at,
			COALESCE(meta_title, ''), COALESCE(meta_description, ''), COALESCE(og_image, '')
	`

	var tag model.Tag
	err := r.pool.QueryRow(ctx, query,
		req.Name, slug, req.MetaTitle, req.MetaDescription, req.OGImage,
	).Scan(
		&tag.ID, &tag.Name, &tag.Slug, &tag.CreatedAt,
		&tag.MetaTitle, &tag.MetaDescription, &tag.OGImage,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create tag: %w", err)
	}

	return &tag, nil
}

func (r *tagRepository) Update(ctx context.Context, id int64, req *model.TagUpdateRequest) (*model.Tag, error) {
	var setParts []string
	var args []interface{}
	argIndex := 1

	if req.Name != nil {
		setParts = append(setParts, fmt.Sprintf("name = $%d", argIndex))
		args = append(args, *req.Name)
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

	if req.OGImage != nil {
		setParts = append(setParts, fmt.Sprintf("og_image = $%d", argIndex))
		args = append(args, *req.OGImage)
		argIndex++
	}

	if len(setParts) == 0 {
		return r.GetByID(ctx, id)
	}

	query := fmt.Sprintf(`
		UPDATE tags
		SET %s
		WHERE id = $%d
		RETURNING id, name, slug, created_at,
			COALESCE(meta_title, ''), COALESCE(meta_description, ''), COALESCE(og_image, '')
	`, strings.Join(setParts, ", "), argIndex)

	args = append(args, id)

	var tag model.Tag
	err := r.pool.QueryRow(ctx, query, args...).Scan(
		&tag.ID, &tag.Name, &tag.Slug, &tag.CreatedAt,
		&tag.MetaTitle, &tag.MetaDescription, &tag.OGImage,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("tag not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update tag: %w", err)
	}

	return &tag, nil
}

func (r *tagRepository) GetByID(ctx context.Context, id int64) (*model.Tag, error) {
	query := `
		SELECT id, name, slug, created_at,
			COALESCE(meta_title, ''), COALESCE(meta_description, ''), COALESCE(og_image, '')
		FROM tags
		WHERE id = $1
	`

	var tag model.Tag
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&tag.ID, &tag.Name, &tag.Slug, &tag.CreatedAt,
		&tag.MetaTitle, &tag.MetaDescription, &tag.OGImage,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("tag not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get tag: %w", err)
	}

	return &tag, nil
}

func (r *tagRepository) GetBySlug(ctx context.Context, slug string) (*model.Tag, error) {
	query := `
		SELECT id, name, slug, created_at,
			COALESCE(meta_title, ''), COALESCE(meta_description, ''), COALESCE(og_image, '')
		FROM tags
		WHERE slug = $1
	`

	var tag model.Tag
	err := r.pool.QueryRow(ctx, query, slug).Scan(
		&tag.ID, &tag.Name, &tag.Slug, &tag.CreatedAt,
		&tag.MetaTitle, &tag.MetaDescription, &tag.OGImage,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("tag not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get tag: %w", err)
	}

	return &tag, nil
}

func (r *tagRepository) List(ctx context.Context) (*model.TagListResponse, error) {
	query := `
		SELECT id, name, slug, created_at,
			COALESCE(meta_title, ''), COALESCE(meta_description, ''), COALESCE(og_image, '')
		FROM tags
		ORDER BY name ASC
	`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list tags: %w", err)
	}
	defer rows.Close()

	var tags []model.Tag
	for rows.Next() {
		var tag model.Tag
		err := rows.Scan(
			&tag.ID, &tag.Name, &tag.Slug, &tag.CreatedAt,
			&tag.MetaTitle, &tag.MetaDescription, &tag.OGImage,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan tag: %w", err)
		}
		tags = append(tags, tag)
	}

	if tags == nil {
		tags = []model.Tag{}
	}

	return &model.TagListResponse{
		Items: tags,
		Total: len(tags),
	}, nil
}

func (r *tagRepository) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM tags WHERE id = $1`
	result, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete tag: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("tag not found")
	}

	return nil
}

func (r *tagRepository) AddToPost(ctx context.Context, postID, tagID int64) error {
	query := `INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`
	_, err := r.pool.Exec(ctx, query, postID, tagID)
	if err != nil {
		return fmt.Errorf("failed to add tag to post: %w", err)
	}
	return nil
}

func (r *tagRepository) RemoveFromPost(ctx context.Context, postID, tagID int64) error {
	query := `DELETE FROM post_tags WHERE post_id = $1 AND tag_id = $2`
	_, err := r.pool.Exec(ctx, query, postID, tagID)
	if err != nil {
		return fmt.Errorf("failed to remove tag from post: %w", err)
	}
	return nil
}

func (r *tagRepository) GetPostTags(ctx context.Context, postID int64) ([]model.Tag, error) {
	query := `
		SELECT t.id, t.name, t.slug, t.created_at
		FROM tags t
		JOIN post_tags pt ON t.id = pt.tag_id
		WHERE pt.post_id = $1
		ORDER BY t.name ASC
	`

	rows, err := r.pool.Query(ctx, query, postID)
	if err != nil {
		return nil, fmt.Errorf("failed to get post tags: %w", err)
	}
	defer rows.Close()

	var tags []model.Tag
	for rows.Next() {
		var tag model.Tag
		err := rows.Scan(&tag.ID, &tag.Name, &tag.Slug, &tag.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan tag: %w", err)
		}
		tags = append(tags, tag)
	}

	if tags == nil {
		tags = []model.Tag{}
	}

	return tags, nil
}

func (r *tagRepository) SetPostTags(ctx context.Context, postID int64, tagIDs []int64) error {
	// Удаляем все текущие теги
	_, err := r.pool.Exec(ctx, `DELETE FROM post_tags WHERE post_id = $1`, postID)
	if err != nil {
		return fmt.Errorf("failed to clear post tags: %w", err)
	}

	// Добавляем новые теги
	for _, tagID := range tagIDs {
		if err := r.AddToPost(ctx, postID, tagID); err != nil {
			return err
		}
	}

	return nil
}
