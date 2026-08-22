-- +goose Up
-- +goose StatementBegin

ALTER TABLE posts ADD COLUMN meta_title TEXT;
ALTER TABLE posts ADD COLUMN meta_description TEXT;
ALTER TABLE posts ADD COLUMN meta_keywords TEXT[];
ALTER TABLE posts ADD COLUMN og_image TEXT;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

ALTER TABLE posts DROP COLUMN IF EXISTS meta_title;
ALTER TABLE posts DROP COLUMN IF EXISTS meta_description;
ALTER TABLE posts DROP COLUMN IF EXISTS meta_keywords;
ALTER TABLE posts DROP COLUMN IF EXISTS og_image;

-- +goose StatementEnd