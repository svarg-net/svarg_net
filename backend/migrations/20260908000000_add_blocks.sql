-- +goose Up

-- Режим контента поста: старый Plate или новый блочный редактор
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_mode varchar(10) NOT NULL DEFAULT 'plate';

-- Блоки поста (уникальность позиции НЕ ставим — мешает reorder в транзакции)
CREATE TABLE IF NOT EXISTS blocks (
  id bigserial PRIMARY KEY,
  post_id bigint NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  type varchar(50) NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  position integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blocks_post ON blocks(post_id, position);
CREATE INDEX IF NOT EXISTS idx_blocks_type ON blocks(type);

-- +goose Down
DROP TABLE IF EXISTS blocks;
ALTER TABLE posts DROP COLUMN IF EXISTS content_mode;
