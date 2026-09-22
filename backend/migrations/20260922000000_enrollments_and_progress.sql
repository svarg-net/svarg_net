-- +goose Up

-- Записи студентов на курсы
CREATE TABLE IF NOT EXISTS enrollments (
    id          bigserial PRIMARY KEY,
    user_id     bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id   bigint NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);

-- Прогресс по урокам
CREATE TABLE IF NOT EXISTS lesson_progress (
    id           bigserial PRIMARY KEY,
    user_id      bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id    bigint NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    quiz_score   integer,             -- NULL = тест ещё не сдавали
    completed_at timestamptz,         -- NULL = урок не завершён
    updated_at   timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);

-- +goose Down
DROP TABLE IF EXISTS lesson_progress;
DROP TABLE IF EXISTS enrollments;
