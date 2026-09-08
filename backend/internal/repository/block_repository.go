package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"svarg_net/internal/model"
)

type BlockRepository interface {
	ListByPostID(ctx context.Context, postID int64) ([]model.Block, error)
	GetByID(ctx context.Context, id int64) (*model.Block, error)
	Create(ctx context.Context, data model.BlockCreateData) (*model.Block, error)
	Update(ctx context.Context, id int64, upd model.BlockUpdateData) (*model.Block, error)
	Delete(ctx context.Context, id int64) error
	Reorder(ctx context.Context, postID int64, blockIDs []int64) error
	CountByPostID(ctx context.Context, postID int64) (int, error)
	DeleteAllByPostID(ctx context.Context, postID int64) error
}

type blockRepository struct {
	pool *pgxpool.Pool
}

func NewBlockRepository(pool *pgxpool.Pool) BlockRepository {
	return &blockRepository{pool: pool}
}

func (r *blockRepository) ListByPostID(ctx context.Context, postID int64) ([]model.Block, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, post_id, type, data, position, created_at, updated_at
		FROM blocks
		WHERE post_id = $1
		ORDER BY position, id
	`, postID)
	if err != nil {
		return nil, fmt.Errorf("failed to query blocks: %w", err)
	}
	defer rows.Close()

	blocks := []model.Block{}
	for rows.Next() {
		var b model.Block
		if err := rows.Scan(&b.ID, &b.PostID, &b.Type, &b.Data, &b.Position, &b.CreatedAt, &b.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan block: %w", err)
		}
		blocks = append(blocks, b)
	}
	return blocks, nil
}

func (r *blockRepository) GetByID(ctx context.Context, id int64) (*model.Block, error) {
	var b model.Block
	err := r.pool.QueryRow(ctx, `
		SELECT id, post_id, type, data, position, created_at, updated_at
		FROM blocks WHERE id = $1
	`, id).Scan(&b.ID, &b.PostID, &b.Type, &b.Data, &b.Position, &b.CreatedAt, &b.UpdatedAt)

	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get block: %w", err)
	}
	return &b, nil
}

func (r *blockRepository) Create(ctx context.Context, data model.BlockCreateData) (*model.Block, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	position := 0
	if data.Position != nil {
		position = *data.Position
		// Сдвигаем блоки справа, чтобы освободить место
		_, err = tx.Exec(ctx, `
			UPDATE blocks SET position = position + 1
			WHERE post_id = $1 AND position >= $2
		`, data.PostID, position)
		if err != nil {
			return nil, fmt.Errorf("failed to shift blocks: %w", err)
		}
	} else {
		// В конец: max + 1
		err = tx.QueryRow(ctx, `
			SELECT COALESCE(MAX(position), -1) + 1 FROM blocks WHERE post_id = $1
		`, data.PostID).Scan(&position)
		if err != nil {
			return nil, fmt.Errorf("failed to get next position: %w", err)
		}
	}

	dataJSON := data.Data
	if len(dataJSON) == 0 {
		dataJSON = json.RawMessage("{}")
	}

	var b model.Block
	err = tx.QueryRow(ctx, `
		INSERT INTO blocks (post_id, type, data, position)
		VALUES ($1, $2, $3, $4)
		RETURNING id, post_id, type, data, position, created_at, updated_at
	`, data.PostID, data.Type, dataJSON, position).
		Scan(&b.ID, &b.PostID, &b.Type, &b.Data, &b.Position, &b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to insert block: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit: %w", err)
	}
	return &b, nil
}

func (r *blockRepository) Update(ctx context.Context, id int64, upd model.BlockUpdateData) (*model.Block, error) {
	var b model.Block
	err := r.pool.QueryRow(ctx, `
		UPDATE blocks SET
			type = COALESCE($1, type),
			data = COALESCE($2, data),
			updated_at = now()
		WHERE id = $3
		RETURNING id, post_id, type, data, position, created_at, updated_at
	`, upd.Type, upd.Data, id).
		Scan(&b.ID, &b.PostID, &b.Type, &b.Data, &b.Position, &b.CreatedAt, &b.UpdatedAt)

	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to update block: %w", err)
	}
	return &b, nil
}

func (r *blockRepository) Delete(ctx context.Context, id int64) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var postID int64
	err = tx.QueryRow(ctx, `DELETE FROM blocks WHERE id = $1 RETURNING post_id`, id).Scan(&postID)
	if err == pgx.ErrNoRows {
		return nil // уже удалён
	}
	if err != nil {
		return fmt.Errorf("failed to delete block: %w", err)
	}

	// Перенумеровываем оставшиеся блоки: 0, 1, 2, ...
	if err := renumberBlocks(ctx, tx, postID); err != nil {
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit: %w", err)
	}
	return nil
}

func (r *blockRepository) Reorder(ctx context.Context, postID int64, blockIDs []int64) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Проверка: все блоки принадлежат посту
	var count int
	err = tx.QueryRow(ctx, `
		SELECT COUNT(*) FROM blocks WHERE post_id = $1 AND id = ANY($2)
	`, postID, blockIDs).Scan(&count)
	if err != nil {
		return fmt.Errorf("failed to check block ownership: %w", err)
	}
	if count != len(blockIDs) {
		return fmt.Errorf("some blocks do not belong to post %d", postID)
	}

	// Фаза 1: временные большие позиции (чтобы не словить unique/duplicate)
	for i, id := range blockIDs {
		if _, err := tx.Exec(ctx, `
			UPDATE blocks SET position = 1000000 + $1, updated_at = now() WHERE id = $2
		`, i, id); err != nil {
			return fmt.Errorf("failed to set temp position: %w", err)
		}
	}

	// Фаза 2: финальные позиции
	for i, id := range blockIDs {
		if _, err := tx.Exec(ctx, `
			UPDATE blocks SET position = $1, updated_at = now() WHERE id = $2
		`, i, id); err != nil {
			return fmt.Errorf("failed to set final position: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit: %w", err)
	}
	return nil
}

func (r *blockRepository) CountByPostID(ctx context.Context, postID int64) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM blocks WHERE post_id = $1`, postID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count blocks: %w", err)
	}
	return count, nil
}

func (r *blockRepository) DeleteAllByPostID(ctx context.Context, postID int64) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM blocks WHERE post_id = $1`, postID)
	if err != nil {
		return fmt.Errorf("failed to delete all blocks: %w", err)
	}
	return nil
}

// renumberBlocks перенумеровывает позиции блоков поста: 0, 1, 2, ...
func renumberBlocks(ctx context.Context, tx pgx.Tx, postID int64) error {
	_, err := tx.Exec(ctx, `
		WITH ordered AS (
			SELECT id, ROW_NUMBER() OVER (ORDER BY position, id) - 1 AS new_pos
			FROM blocks
			WHERE post_id = $1
		)
		UPDATE blocks b SET position = o.new_pos
		FROM ordered o
		WHERE b.id = o.id
	`, postID)
	if err != nil {
		return fmt.Errorf("failed to renumber blocks: %w", err)
	}
	return nil
}
