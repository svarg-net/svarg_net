-- +goose Up
-- +goose StatementBegin

ALTER TABLE categories ADD COLUMN meta_title TEXT;
ALTER TABLE categories ADD COLUMN meta_description TEXT;
ALTER TABLE categories ADD COLUMN og_image TEXT;

ALTER TABLE tags ADD COLUMN meta_title TEXT;
ALTER TABLE tags ADD COLUMN meta_description TEXT;
ALTER TABLE tags ADD COLUMN og_image TEXT;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

ALTER TABLE categories DROP COLUMN IF EXISTS meta_title;
ALTER TABLE categories DROP COLUMN IF EXISTS meta_description;
ALTER TABLE categories DROP COLUMN IF EXISTS og_image;

ALTER TABLE tags DROP COLUMN IF EXISTS meta_title;
ALTER TABLE tags DROP COLUMN IF EXISTS meta_description;
ALTER TABLE tags DROP COLUMN IF EXISTS og_image;

-- +goose StatementEnd