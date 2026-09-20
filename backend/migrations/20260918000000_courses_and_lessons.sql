-- +goose Up

CREATE TABLE IF NOT EXISTS courses (
    id           bigserial PRIMARY KEY,
    title        varchar(255) NOT NULL,
    slug         varchar(255) NOT NULL UNIQUE,
    description  text,
    cover_url    varchar(512),
    status       varchar(20) NOT NULL DEFAULT 'draft',  -- draft / published
    level        varchar(20) NOT NULL DEFAULT 'beginner', -- beginner / intermediate / advanced
    position     integer NOT NULL DEFAULT 0,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_position ON courses(position);

CREATE TABLE IF NOT EXISTS lessons (
    id           bigserial PRIMARY KEY,
    course_id    bigint NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title        varchar(255) NOT NULL,
    slug         varchar(255) NOT NULL,
    position     integer NOT NULL DEFAULT 0,
    is_free      boolean NOT NULL DEFAULT false,  -- видна без авторизации
    min_score    integer NOT NULL DEFAULT 0,      -- 0 = без теста
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    UNIQUE(course_id, slug)
);

CREATE INDEX idx_lessons_course_position ON lessons(course_id, position);

-- lesson_blocks — зеркало blocks, но привязка к lesson_id
CREATE TABLE IF NOT EXISTS lesson_blocks (
    id           bigserial PRIMARY KEY,
    lesson_id    bigint NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    type         varchar(50) NOT NULL,
    data         jsonb NOT NULL DEFAULT '{}',
    position     integer NOT NULL DEFAULT 0,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lesson_blocks_lesson_position ON lesson_blocks(lesson_id, position);

-- +goose Down
DROP TABLE IF EXISTS lesson_blocks;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS courses;
