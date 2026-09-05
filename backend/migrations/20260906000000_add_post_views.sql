-- +goose Up
ALTER TABLE posts ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS post_views (
  id bigserial PRIMARY KEY,
  post_id bigint NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  viewer_hash varchar(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_created_at ON post_views(created_at);
CREATE INDEX IF NOT EXISTS idx_post_views_post_hash ON post_views(post_id, viewer_hash);

-- +goose Down
DROP TABLE IF EXISTS post_views;
ALTER TABLE posts DROP COLUMN IF EXISTS views_count;
