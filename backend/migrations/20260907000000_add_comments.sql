-- +goose Up

-- Флаг разрешения комментариев у поста (по умолчанию открыты)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments_enabled boolean NOT NULL DEFAULT true;

-- Таблица комментариев
CREATE TABLE IF NOT EXISTS comments (
  id bigserial PRIMARY KEY,
  post_id bigint NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_id bigint REFERENCES comments(id) ON DELETE CASCADE,
  author_name varchar(100) NOT NULL,
  author_email varchar(255),
  content text NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending',  -- pending/approved/rejected
  ip_hash varchar(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- +goose Down
DROP TABLE IF EXISTS comments;
ALTER TABLE posts DROP COLUMN IF EXISTS comments_enabled;
