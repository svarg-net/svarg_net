package repository

import (
	"context"
	"fmt"
	"strings"

	"svarg_net/internal/model"

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

	cat, err := scanCategory(r.pool.QueryRow(ctx, `
		INSERT INTO categories (name, slug, description, parent_id, created_at, updated_at, meta_title, meta_description, og_image)
		VALUES ($1, $2, $3, $4, now(), now(), $5, $6, $7)
		RETURNING `+categoryColumns,
		req.Name, slug, req.Description, req.ParentID,
		req.MetaTitle, req.MetaDescription, req.OGImage))
	if err != nil {
		return nil, fmt.Errorf("failed to create category: %w", err)
	}
	if cat == nil {
		return nil, fmt.Errorf("failed to create category: no row returned")
	}
	return cat, nil
}

func (r *categoryRepository) GetByID(ctx context.Context, id int64) (*model.Category, error) {
	cat, err := scanCategory(r.pool.QueryRow(ctx,
		`SELECT `+categoryColumns+` FROM categories WHERE id = $1`, id))
	if err != nil {
		return nil, err
	}
	if cat == nil {
		return nil, fmt.Errorf("category not found")
	}
	return cat, nil
}

func (r *categoryRepository) GetBySlug(ctx context.Context, slug string) (*model.Category, error) {
	cat, err := scanCategory(r.pool.QueryRow(ctx,
		`SELECT `+categoryColumns+` FROM categories WHERE slug = $1`, slug))
	if err != nil {
		return nil, err
	}
	if cat == nil {
		return nil, fmt.Errorf("category not found")
	}
	return cat, nil
}

func (r *categoryRepository) List(ctx context.Context) (*model.CategoryListResponse, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT `+categoryColumns+` FROM categories ORDER BY name ASC`)
	if err != nil {
		return nil, fmt.Errorf("failed to list categories: %w", err)
	}

	categories, err := scanCategories(rows)
	if err != nil {
		return nil, err
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
	args = append(args, id)

	cat, err := scanCategory(r.pool.QueryRow(ctx,
		fmt.Sprintf(`UPDATE categories SET %s WHERE id = $%d RETURNING `+categoryColumns,
			strings.Join(setParts, ", "), argIndex),
		args...))
	if err != nil {
		return nil, fmt.Errorf("failed to update category: %w", err)
	}
	if cat == nil {
		return nil, fmt.Errorf("category not found")
	}
	return cat, nil
}

func (r *categoryRepository) Delete(ctx context.Context, id int64) error {
	result, err := r.pool.Exec(ctx, `DELETE FROM categories WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("failed to delete category: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("category not found")
	}
	return nil
}
