package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PollRepository interface {
	HasVoted(ctx context.Context, blockID int64, ipHash string) (bool, error)
	AddVotes(ctx context.Context, blockID int64, optionIndexes []int, ipHash string) error
	GetCounts(ctx context.Context, blockID int64) (map[int]int, error)
	TotalVoters(ctx context.Context, blockID int64) (int, error)
}

type pollRepository struct {
	pool *pgxpool.Pool
}

func NewPollRepository(pool *pgxpool.Pool) PollRepository {
	return &pollRepository{pool: pool}
}

func (r *pollRepository) HasVoted(ctx context.Context, blockID int64, ipHash string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM poll_votes WHERE block_id = $1 AND ip_hash = $2)`,
		blockID, ipHash).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check poll vote: %w", err)
	}
	return exists, nil
}

func (r *pollRepository) AddVotes(ctx context.Context, blockID int64, optionIndexes []int, ipHash string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	for _, idx := range optionIndexes {
		if _, err := tx.Exec(ctx, `
			INSERT INTO poll_votes (block_id, option_index, ip_hash)
			VALUES ($1, $2, $3)
			ON CONFLICT DO NOTHING`,
			blockID, idx, ipHash); err != nil {
			return fmt.Errorf("failed to insert poll vote: %w", err)
		}
	}

	return tx.Commit(ctx)
}

func (r *pollRepository) GetCounts(ctx context.Context, blockID int64) (map[int]int, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT option_index, COUNT(*) AS cnt
		FROM poll_votes
		WHERE block_id = $1
		GROUP BY option_index`, blockID)
	if err != nil {
		return nil, fmt.Errorf("failed to get poll counts: %w", err)
	}
	defer rows.Close()

	counts := map[int]int{}
	for rows.Next() {
		var idx, cnt int
		if err := rows.Scan(&idx, &cnt); err != nil {
			return nil, fmt.Errorf("failed to scan poll count: %w", err)
		}
		counts[idx] = cnt
	}
	return counts, nil
}

func (r *pollRepository) TotalVoters(ctx context.Context, blockID int64) (int, error) {
	var total int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(DISTINCT ip_hash) FROM poll_votes WHERE block_id = $1`,
		blockID).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("failed to count poll voters: %w", err)
	}
	return total, nil
}
