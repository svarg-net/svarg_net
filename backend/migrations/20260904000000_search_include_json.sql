-- +goose Up

-- Извлекает весь текст из Plate JSON (все поля "text" на любой глубине)
-- +goose StatementBegin
CREATE OR REPLACE FUNCTION plate_json_to_text(j text) RETURNS text AS $$
BEGIN
  IF j IS NULL OR trim(j) = '' THEN
    RETURN '';
  END IF;
  RETURN (
    SELECT COALESCE(string_agg(t #>> '{}', ' '), '')
    FROM jsonb_path_query(j::jsonb, '$.**.text') AS t
  );
EXCEPTION WHEN OTHERS THEN
  RETURN '';
END;
$$ LANGUAGE plpgsql IMMUTABLE;
-- +goose StatementEnd

-- Обновляем триггер: добавляем контент из JSON (вес C)
-- +goose StatementBegin
CREATE OR REPLACE FUNCTION update_posts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('russian', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('russian', COALESCE(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('russian', COALESCE(NEW.content_md, '')), 'C') ||
    setweight(to_tsvector('russian', plate_json_to_text(NEW.content_json::text)), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

-- Пересчитываем векторы для существующих постов
UPDATE posts SET search_vector =
  setweight(to_tsvector('russian', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('russian', COALESCE(excerpt, '')), 'B') ||
  setweight(to_tsvector('russian', COALESCE(content_md, '')), 'C') ||
  setweight(to_tsvector('russian', plate_json_to_text(content_json::text)), 'C');

-- +goose Down
DROP FUNCTION IF EXISTS plate_json_to_text(text);
