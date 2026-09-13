-- +goose Up

CREATE TABLE IF NOT EXISTS poll_votes (
    id BIGSERIAL PRIMARY KEY,
    block_id BIGINT NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
    option_index INT NOT NULL,
    ip_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (block_id, ip_hash, option_index)
);

CREATE INDEX IF NOT EXISTS idx_poll_votes_block ON poll_votes(block_id);

-- +goose Down
DROP INDEX IF EXISTS idx_poll_votes_block;
DROP TABLE IF EXISTS poll_votes;
