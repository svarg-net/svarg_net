package repository

import (
	"context"
	"fmt"
	"strings"

	"svarg_net/internal/model"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// CategoryRepository интерфейс для работы с категориями
type CategoryRepository interface {
	Create(ctx context.Context, req *model.CategoryCreateRequest) (*model.Category, error)
	GetByID(ctx context.Context, id int64) (*model.Category, error)
	GetBySlug(ctx context.Context, slug string) (*model.Category, error)
	List(ctx context.Context) (*model.CategoryListResponse, error)
	Update(ctx context.Context, id int64, req *model.CategoryUpdateRequest) (*model.Category, error)
	Delete(ctx context.Context, id int64) error
}

type categoryRepository struct {
	pool *pgxpool.Pool
}

// NewCategoryRepository создаёт новый репозиторий категорий
func NewCategoryRepository(pool *pgxpool.Pool) CategoryRepository {
	return &categoryRepository{pool: pool}
}

func (r *categoryRepository) Create(ctx context.Context, req *model.CategoryCreateRequest) (*model.Category, error) {
	slug := generateSlug(req.Name)

	query := `
		INSERT INTO categories (name, slug, description, parent_id, created_at, updated_at, meta_title, meta_description, og_image)
		VALUES ($1, $2, $3, $4, now(), now(), $5, $6, $7)
		RETURNING id, name, slug, description, parent_id, created_at, updated_at,
			COALESCE(meta_title, ''), COALESCE(meta_description, ''), COALESCE(og_image, '')
	`

	var category model.Category
	err := r.pool.QueryRow(ctx, query,
		req.Name, slug, req.Description, req.ParentID,
		req.MetaTitle, req.MetaDescription, req.OGImage,
	).Scan(
		&category.ID, &category.Name, &category.Slug, &category.Description,
		&category.ParentID, &category.CreatedAt, &category.UpdatedAt,
		&category.MetaTitle, &category.MetaDescription, &category.OGImage,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create category: %w", err)
	}

	return &category, nil
}

func (r *categoryRepository) GetByID(ctx context.Context, id int64) (*model.Category, error) {
	query := `
		SELECT id, name, slug, description, parent_id, created_at, updated_at,
			COALESCE(meta_title, ''), COALESCE(meta_description, ''), COALESCE(og_image, '')
		FROM categories
		WHERE id = $1
	`

	var category model.Category
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&category.ID, &category.Name, &category.Slug, &category.Description,
		&category.ParentID, &category.CreatedAt, &category.UpdatedAt,
		&category.MetaTitle, &category.MetaDescription, &category.OGImage,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("category not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get category: %w", err)
	}

	return &category, nil
}

func (r *categoryRepository) GetBySlug(ctx context.Context, slug string) (*model.Category, error) {
	query := `
		SELECT id, name, slug, description, parent_id, created_at, updated_at,
			COALESCE(meta_title, ''), COALESCE(meta_description, ''), COALESCE(og_image, '')
		FROM categories
		WHERE slug = $1
	`

	var category model.Category
	err := r.pool.QueryRow(ctx, query, slug).Scan(
		&category.ID, &category.Name, &category.Slug, &category.Description,
		&category.ParentID, &category.CreatedAt, &category.UpdatedAt,
		&category.MetaTitle, &category.MetaDescription, &category.OGImage,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("category not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get category: %w", err)
	}

	return &category, nil
}

func (r *categoryRepository) List(ctx context.Context) (*model.CategoryListResponse, error) {
	query := `
		SELECT id, name, slug, description, parent_id, created_at, updated_at,
			COALESCE(meta_title, ''), COALESCE(meta_description, ''), COALESCE(og_image, '')
		FROM categories
		ORDER BY name ASC
	`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list categories: %w", err)
	}
	defer rows.Close()

	var categories []model.Category
	for rows.Next() {
		var category model.Category
		err := rows.Scan(
			&category.ID, &category.Name, &category.Slug, &category.Description,
			&category.ParentID, &category.CreatedAt, &category.UpdatedAt,
			&category.MetaTitle, &category.MetaDescription, &category.OGImage,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan category: %w", err)
		}
		categories = append(categories, category)
	}

	if categories == nil {
		categories = []model.Category{}
	}

	return &model.CategoryListResponse{
		Items: categories,
		Total: len(categories),
	}, nil
}

func (r *categoryRepository) Update(ctx context.Context, id int64, req *model.CategoryUpdateRequest) (*model.Category, error) {
	var setParts []string
	var args []interface{}
	argIndex := 1

	if req.Name != nil {
		setParts = append(setParts, fmt.Sprintf("name = $%d", argIndex))
		args = append(args, *req.Name)
		argIndex++
	}

	if req.Description != nil {
		setParts = append(setParts, fmt.Sprintf("description = $%d", argIndex))
		args = append(args, *req.Description)
		argIndex++
	}

	if req.ParentID != nil {
		setParts = append(setParts, fmt.Sprintf("parent_id = $%d", argIndex))
		args = append(args, *req.ParentID)
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

	setParts = append(setParts, "updated_at = now()")

	query := fmt.Sprintf(`
		UPDATE categories
		SET %s
		WHERE id = $%d
		RETURNING id, name, slug, description, parent_id, created_at, updated_at,
			COALESCE(meta_title, ''), COALESCE(meta_description, ''), COALESCE(og_image, '')
	`, strings.Join(setParts, ", "), argIndex)

	args = append(args, id)

	var category model.Category
	err := r.pool.QueryRow(ctx, query, args...).Scan(
		&category.ID, &category.Name, &category.Slug, &category.Description,
		&category.ParentID, &category.CreatedAt, &category.UpdatedAt,
		&category.MetaTitle, &category.MetaDescription, &category.OGImage,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("category not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update category: %w", err)
	}

	return &category, nil
}

func (r *categoryRepository) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM categories WHERE id = $1`
	result, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete category: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("category not found")
	}

	return nil
}
