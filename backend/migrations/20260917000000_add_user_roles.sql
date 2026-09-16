-- +goose Up

-- Роли пользователей: admin (управление) / student (курсы, прогресс)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role varchar(20) NOT NULL DEFAULT 'student';

-- Существующие аккаунты (сейчас только админ) делаем админами
UPDATE users SET role = 'admin';

-- +goose Down
ALTER TABLE users DROP COLUMN IF EXISTS role;
