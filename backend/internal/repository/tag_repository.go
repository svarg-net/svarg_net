package repository

import (
	"context"
	"fmt"
	"strings"

	"svarg_net/internal/model"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// tagColumns — единый список колонок для SELECT тегов.
// Порядок совпадает со scanTag.
const tagColumns = `id, name, slug, created_at,
	COALESCE(meta_title, ''), COALESCE(meta_description, ''), COALESCE(og_image, '')`

// scanTag читает одну строку тега в модель.
// Возвращает (nil, nil) если строк нет.
func scanTag(row pgx.Row) (*model.Tag, error) {
	var t model.Tag
	err := row.Scan(
		&t.ID, &t.Name, &t.Slug, &t.CreatedAt,
		&t.MetaTitle, &t.MetaDescription, &t.OGImage,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to scan tag: %w", err)
	}
	return &t, nil
}

// scanTags читает все строки результата в срез тегов.
func scanTags(rows pgx.Rows) ([]model.Tag, error) {
	defer rows.Close()

	tags := []model.Tag{}
	for rows.Next() {
		t, err := scanTag(rows)
		if err != nil {
			return nil, err
		}
		if t != nil {
			tags = append(tags, *t)
		}
	}
	return tags, nil
}

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

	tag, err := scanTag(r.pool.QueryRow(ctx, `
		INSERT INTO tags (name, slug, created_at, meta_title, meta_description, og_image)
		VALUES ($1, $2, now(), $3, $4, $5)
		RETURNING `+tagColumns,
		req.Name, slug, req.MetaTitle, req.MetaDescription, req.OGImage))
	if err != nil {
		return nil, fmt.Errorf("failed to create tag: %w", err)
	}
	if tag == nil {
		return nil, fmt.Errorf("failed to create tag: no row returned")
	}
	return tag, nil
}

func (r *tagRepository) GetByID(ctx context.Context, id int64) (*model.Tag, error) {
	tag, err := scanTag(r.pool.QueryRow(ctx,
		`SELECT `+tagColumns+` FROM tags WHERE id = $1`, id))
	if err != nil {
		return nil, err
	}
	if tag == nil {
		return nil, fmt.Errorf("tag not found")
	}
	return tag, nil
}

func (r *tagRepository) GetBySlug(ctx context.Context, slug string) (*model.Tag, error) {
	tag, err := scanTag(r.pool.QueryRow(ctx,
		`SELECT `+tagColumns+` FROM tags WHERE slug = $1`, slug))
	if err != nil {
		return nil, err
	}
	if tag == nil {
		return nil, fmt.Errorf("tag not found")
	}
	return tag, nil
}

func (r *tagRepository) List(ctx context.Context) (*model.TagListResponse, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT `+tagColumns+` FROM tags ORDER BY name ASC`)
	if err != nil {
		return nil, fmt.Errorf("failed to list tags: %w", err)
	}

	tags, err := scanTags(rows)
	if err != nil {
		return nil, err
	}

	return &model.TagListResponse{
		Items: tags,
		Total: len(tags),
	}, nil
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

	args = append(args, id)

	tag, err := scanTag(r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE tags SET %s WHERE id = $%d RETURNING `+tagColumns,
			strings.Join(setParts, ", "), argIndex),
		args...))
	if err != nil {
		return nil, fmt.Errorf("failed to update tag: %w", err)
	}
	if tag == nil {
		return nil, fmt.Errorf("tag not found")
	}
	return tag, nil
}

func (r *tagRepository) Delete(ctx context.Context, id int64) error {
	result, err := r.pool.Exec(ctx, `DELETE FROM tags WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("failed to delete tag: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("tag not found")
	}
	return nil
}

func (r *tagRepository) AddToPost(ctx context.Context, postID, tagID int64) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		postID, tagID)
	if err != nil {
		return fmt.Errorf("failed to add tag to post: %w", err)
	}
	return nil
}

func (r *tagRepository) RemoveFromPost(ctx context.Context, postID, tagID int64) error {
	_, err := r.pool.Exec(ctx,
		`DELETE FROM post_tags WHERE post_id = $1 AND tag_id = $2`,
		postID, tagID)
	if err != nil {
		return fmt.Errorf("failed to remove tag from post: %w", err)
	}
	return nil
}

// GetPostTags возвращает все теги поста (с meta-полями, чтобы использовать scanTag).
func (r *tagRepository) GetPostTags(ctx context.Context, postID int64) ([]model.Tag, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT t.id, t.name, t.slug, t.created_at,
			COALESCE(t.meta_title, ''), COALESCE(t.meta_description, ''), COALESCE(t.og_image, '')
		FROM tags t
		JOIN post_tags pt ON t.id = pt.tag_id
		WHERE pt.post_id = $1
		ORDER BY t.name ASC`,
		postID)
	if err != nil {
		return nil, fmt.Errorf("failed to get post tags: %w", err)
	}
	return scanTags(rows)
}

func (r *tagRepository) SetPostTags(ctx context.Context, postID int64, tagIDs []int64) error {
	if _, err := r.pool.Exec(ctx,
		`DELETE FROM post_tags WHERE post_id = $1`, postID); err != nil {
		return fmt.Errorf("failed to clear post tags: %w", err)
	}
	for _, tagID := range tagIDs {
		if err := r.AddToPost(ctx, postID, tagID); err != nil {
			return err
		}
	}
	return nil
}
