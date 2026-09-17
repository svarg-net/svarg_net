package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"svarg_net/internal/model"
)

// BlockRepository — операции с блоками.
// Одна реализация параметризована таблицей и колонкой владельца:
//   - посты:  table=blocks,        ownerCol=post_id
//   - уроки:  table=lesson_blocks, ownerCol=lesson_id
//
// В model.Block поле PostID хранит id владельца (поста или урока).
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
	pool     *pgxpool.Pool
	table    string
	ownerCol string
}

// NewBlockRepository репозиторий блоков постов
func NewBlockRepository(pool *pgxpool.Pool) BlockRepository {
	return &blockRepository{pool: pool, table: "blocks", ownerCol: "post_id"}
}

// NewLessonBlockRepository репозиторий блоков уроков
func NewLessonBlockRepository(pool *pgxpool.Pool) BlockRepository {
	return &blockRepository{pool: pool, table: "lesson_blocks", ownerCol: "lesson_id"}
}

// columns список колонок SELECT для текущей таблицы
func (r *blockRepository) columns() string {
	return "id, " + r.ownerCol + ", type, data, position, created_at, updated_at"
}

// scanBlock читает одну строку блока. Возвращает (nil, nil) если строк нет.
func scanBlock(row pgx.Row) (*model.Block, error) {
	var b model.Block
	err := row.Scan(
		&b.ID, &b.PostID, &b.Type, &b.Data,
		&b.Position, &b.CreatedAt, &b.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to scan block: %w", err)
	}
	return &b, nil
}

// scanBlocks читает все строки результата в срез блоков.
func scanBlocks(rows pgx.Rows) ([]model.Block, error) {
	defer rows.Close()

	blocks := []model.Block{}
	for rows.Next() {
		b, err := scanBlock(rows)
		if err != nil {
			return nil, err
		}
		if b != nil {
			blocks = append(blocks, *b)
		}
	}
	return blocks, nil
}

func (r *blockRepository) ListByPostID(ctx context.Context, postID int64) ([]model.Block, error) {
	query := fmt.Sprintf(`
		SELECT %s
		FROM %s
		WHERE %s = $1
		ORDER BY position, id`, r.columns(), r.table, r.ownerCol)

	rows, err := r.pool.Query(ctx, query, postID)
	if err != nil {
		return nil, fmt.Errorf("failed to query blocks: %w", err)
	}
	return scanBlocks(rows)
}

func (r *blockRepository) GetByID(ctx context.Context, id int64) (*model.Block, error) {
	query := fmt.Sprintf(`SELECT %s FROM %s WHERE id = $1`, r.columns(), r.table)
	return scanBlock(r.pool.QueryRow(ctx, query, id))
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
		shiftQuery := fmt.Sprintf(`
			UPDATE %s SET position = position + 1
			WHERE %s = $1 AND position >= $2`, r.table, r.ownerCol)
		if _, err := tx.Exec(ctx, shiftQuery, data.PostID, position); err != nil {
			return nil, fmt.Errorf("failed to shift blocks: %w", err)
		}
	} else {
		maxQuery := fmt.Sprintf(`
			SELECT COALESCE(MAX(position), -1) + 1 FROM %s WHERE %s = $1`,
			r.table, r.ownerCol)
		if err := tx.QueryRow(ctx, maxQuery, data.PostID).Scan(&position); err != nil {
			return nil, fmt.Errorf("failed to get next position: %w", err)
		}
	}

	dataJSON := data.Data
	if len(dataJSON) == 0 {
		dataJSON = json.RawMessage("{}")
	}

	insertQuery := fmt.Sprintf(`
		INSERT INTO %s (%s, type, data, position)
		VALUES ($1, $2, $3, $4)
		RETURNING %s`, r.table, r.ownerCol, r.columns())

	block, err := scanBlock(tx.QueryRow(ctx, insertQuery,
		data.PostID, data.Type, dataJSON, position))
	if err != nil {
		return nil, fmt.Errorf("failed to insert block: %w", err)
	}
	if block == nil {
		return nil, fmt.Errorf("failed to insert block: no row returned")
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("failed to commit: %w", err)
	}
	return block, nil
}

func (r *blockRepository) Update(ctx context.Context, id int64, upd model.BlockUpdateData) (*model.Block, error) {
	query := fmt.Sprintf(`
		UPDATE %s SET
			type = COALESCE($1, type),
			data = COALESCE($2, data),
			updated_at = now()
		WHERE id = $3
		RETURNING %s`, r.table, r.columns())

	block, err := scanBlock(r.pool.QueryRow(ctx, query, upd.Type, upd.Data, id))
	if err != nil {
		return nil, fmt.Errorf("failed to update block: %w", err)
	}
	return block, nil
}

func (r *blockRepository) Delete(ctx context.Context, id int64) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var ownerID int64
	delQuery := fmt.Sprintf(`DELETE FROM %s WHERE id = $1 RETURNING %s`,
		r.table, r.ownerCol)
	err = tx.QueryRow(ctx, delQuery, id).Scan(&ownerID)
	if err == pgx.ErrNoRows {
		return nil // уже удалён
	}
	if err != nil {
		return fmt.Errorf("failed to delete block: %w", err)
	}

	if err := renumberBlocks(ctx, tx, r.table, r.ownerCol, ownerID); err != nil {
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

	checkQuery := fmt.Sprintf(`
		SELECT COUNT(*) FROM %s WHERE %s = $1 AND id = ANY($2)`,
		r.table, r.ownerCol)
	var count int
	if err := tx.QueryRow(ctx, checkQuery, postID, blockIDs).Scan(&count); err != nil {
		return fmt.Errorf("failed to check block ownership: %w", err)
	}
	if count != len(blockIDs) {
		return fmt.Errorf("some blocks do not belong to owner %d", postID)
	}

	for i, id := range blockIDs {
		if _, err := tx.Exec(ctx, fmt.Sprintf(`
			UPDATE %s SET position = 1000000 + $1, updated_at = now() WHERE id = $2`, r.table),
			i, id); err != nil {
			return fmt.Errorf("failed to set temp position: %w", err)
		}
	}

	for i, id := range blockIDs {
		if _, err := tx.Exec(ctx, fmt.Sprintf(`
			UPDATE %s SET position = $1, updated_at = now() WHERE id = $2`, r.table),
			i, id); err != nil {
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
	query := fmt.Sprintf(`SELECT COUNT(*) FROM %s WHERE %s = $1`, r.table, r.ownerCol)
	if err := r.pool.QueryRow(ctx, query, postID).Scan(&count); err != nil {
		return 0, fmt.Errorf("failed to count blocks: %w", err)
	}
	return count, nil
}

func (r *blockRepository) DeleteAllByPostID(ctx context.Context, postID int64) error {
	query := fmt.Sprintf(`DELETE FROM %s WHERE %s = $1`, r.table, r.ownerCol)
	if _, err := r.pool.Exec(ctx, query, postID); err != nil {
		return fmt.Errorf("failed to delete all blocks: %w", err)
	}
	return nil
}

// renumberBlocks перенумеровывает позиции блоков владельца: 0, 1, 2, ...
func renumberBlocks(ctx context.Context, tx pgx.Tx, table, ownerCol string, ownerID int64) error {
	query := fmt.Sprintf(`
		WITH ordered AS (
			SELECT id, ROW_NUMBER() OVER (ORDER BY position, id) - 1 AS new_pos
			FROM %s
			WHERE %s = $1
		)
		UPDATE %s b SET position = o.new_pos
		FROM ordered o
		WHERE b.id = o.id`, table, ownerCol, table)

	if _, err := tx.Exec(ctx, query, ownerID); err != nil {
		return fmt.Errorf("failed to renumber blocks: %w", err)
	}
	return nil
}
