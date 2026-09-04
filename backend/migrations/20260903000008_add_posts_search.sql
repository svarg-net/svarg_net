-- +goose Up
ALTER TABLE posts ADD COLUMN search_vector tsvector;

CREATE INDEX idx_posts_search_vector ON posts USING GIN(search_vector);

-- +goose StatementBegin
CREATE OR REPLACE FUNCTION update_posts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('russian', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('russian', COALESCE(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('russian', COALESCE(NEW.content_md, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

-- +goose StatementBegin
CREATE TRIGGER posts_search_vector_update
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_posts_search_vector();
-- +goose StatementEnd

UPDATE posts SET search_vector = 
  setweight(to_tsvector('russian', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('russian', COALESCE(excerpt, '')), 'B') ||
  setweight(to_tsvector('russian', COALESCE(content_md, '')), 'C');

-- +goose Down
DROP TRIGGER IF EXISTS posts_search_vector_update ON posts;
DROP FUNCTION IF EXISTS update_posts_search_vector();
DROP INDEX IF EXISTS idx_posts_search_vector;
ALTER TABLE posts DROP COLUMN IF EXISTS search_vector;
