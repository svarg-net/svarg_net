package repository

import (
	"fmt"

	"svarg_net/internal/model"

	"github.com/jackc/pgx/v5"
)

// categoryColumns — единый список колонок для SELECT категорий.
const categoryColumns = `id, name, slug, description, parent_id, created_at, updated_at,
	COALESCE(meta_title, ''), COALESCE(meta_description, ''), COALESCE(og_image, '')`

// scanCategory читает одну строку категории. Возвращает (nil, nil) если нет строк.
func scanCategory(row pgx.Row) (*model.Category, error) {
	var c model.Category
	err := row.Scan(
		&c.ID, &c.Name, &c.Slug, &c.Description,
		&c.ParentID, &c.CreatedAt, &c.UpdatedAt,
		&c.MetaTitle, &c.MetaDescription, &c.OGImage,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to scan category: %w", err)
	}
	return &c, nil
}

// scanCategories читает все строки результата в срез категорий.
func scanCategories(rows pgx.Rows) ([]model.Category, error) {
	defer rows.Close()

	cats := []model.Category{}
	for rows.Next() {
		c, err := scanCategory(rows)
		if err != nil {
			return nil, err
		}
		if c != nil {
			cats = append(cats, *c)
		}
	}
	return cats, nil
}
