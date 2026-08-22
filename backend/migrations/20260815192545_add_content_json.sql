-- +goose Up
-- +goose StatementBegin

ALTER TABLE posts ADD COLUMN content_json JSONB;
ALTER TABLE posts ALTER COLUMN content_md DROP NOT NULL;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

ALTER TABLE posts DROP COLUMN IF EXISTS content_json;
ALTER TABLE posts ALTER COLUMN content_md SET NOT NULL;

-- +goose StatementEnd