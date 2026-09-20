"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getCourse,
  getLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  type Course,
  type Lesson,
} from "@/lib/api";

const TRANSLIT: Record<string, string> = {
  "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e",
  "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
  "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
  "ф": "f", "х": "h", "ц": "c", "ч": "ch", "ш": "sh", "щ": "sch",
  "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[а-яё]/gi, (c) => TRANSLIT[c.toLowerCase()] || "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function CourseLessonsPage() {
  const params = useParams();
  const courseId = Number(params.id);

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newIsFree, setNewIsFree] = useState(false);
  const [creating, setCreating] = useState(false);

  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    slug: "",
    is_free: false,
    min_score: 0,
  });

  const load = async () => {
    setLoading(true);
    try {
      const [c, l] = await Promise.all([
        getCourse(courseId),
        getLessons(courseId),
      ]);
      setCourse(c);
      setLessons(l.items || []);
    } catch {
      alert("Не удалось загрузить уроки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createLesson(courseId, {
        title: newTitle,
        slug: newSlug,
        is_free: newIsFree,
      });
      setNewTitle("");
      setNewSlug("");
      setNewIsFree(false);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка создания урока");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (l: Lesson) => {
    setEditId(l.id);
    setEditForm({
      title: l.title,
      slug: l.slug,
      is_free: l.is_free,
      min_score: l.min_score,
    });
  };

  const handleSaveEdit = async () => {
    if (editId === null) return;
    try {
      await updateLesson(editId, editForm);
      setEditId(null);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка сохранения");
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Удалить урок "${title}"? Все блоки урока будут удалены.`)) {
      return;
    }
    try {
      await deleteLesson(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка удаления");
    }
  };

  if (loading) return <div className="admin-page">Загрузка...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>
          Уроки курса{" "}
          <Link href={`/admin/courses/${courseId}/edit`}>
            {course?.title ?? `#${courseId}`}
          </Link>
        </h1>
        <Link href="/admin/courses" className="admin-button-secondary">
          ← К курсам
        </Link>
      </div>

      <form onSubmit={handleCreate} className="admin-form lesson-create-form">
        <label>
          Название урока
          <input
            type="text"
            required
            value={newTitle}
            onChange={(e) => {
              setNewTitle(e.target.value);
              setNewSlug(slugify(e.target.value));
            }}
            placeholder="Переменные и типы"
          />
        </label>
        <label>
          Slug
          <input
            type="text"
            required
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={newIsFree}
            onChange={(e) => setNewIsFree(e.target.checked)}
          />
          Бесплатный урок
        </label>
        <button type="submit" disabled={creating} className="admin-button">
          {creating ? "Создание..." : "+ Добавить урок"}
        </button>
      </form>

      {lessons.length === 0 ? (
        <p className="empty-state">У курса пока нет уроков.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Название</th>
              <th>Slug</th>
              <th>Доступ</th>
              <th>Порог теста</th>
              <th>Блоки</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((l, idx) =>
              editId === l.id ? (
                <tr key={l.id} className="edit-row">
                  <td>{idx + 1}</td>
                  <td>
                    <input
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={editForm.slug}
                      onChange={(e) =>
                        setEditForm({ ...editForm, slug: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editForm.is_free}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            is_free: e.target.checked,
                          })
                        }
                      />
                      free
                    </label>
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editForm.min_score}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          min_score: Number(e.target.value),
                        })
                      }
                    />
                  </td>
                  <td>{l.block_count ?? 0}</td>
                  <td className="actions">
                    <button onClick={handleSaveEdit} className="btn-small">
                      💾
                    </button>
                    <button onClick={() => setEditId(null)} className="btn-small">
                      ✖️
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={l.id}>
                  <td>{idx + 1}</td>
                  <td>{l.title}</td>
                  <td>
                    <code>{l.slug}</code>
                  </td>
                  <td>{l.is_free ? "🔓 free" : "🔒 курс"}</td>
                  <td>{l.min_score > 0 ? `${l.min_score}%` : "—"}</td>
                  <td>{l.block_count ?? 0}</td>
                  <td className="actions">
                    <Link
                      href={`/admin/lessons/${l.id}/blocks`}
                      className="btn-small"
                      title="Редактор блоков"
                    >
                      🧱
                    </Link>
                    <button onClick={() => startEdit(l)} className="btn-small">
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(l.id, l.title)}
                      className="btn-small btn-danger"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
