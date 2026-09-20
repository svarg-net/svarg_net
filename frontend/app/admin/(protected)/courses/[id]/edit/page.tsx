'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCourse, updateCourse, type Course } from '@/lib/api';

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.id);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    status: 'draft' as Course['status'],
    level: 'beginner' as Course['level'],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const course = await getCourse(courseId);
        setForm({
          title: course.title,
          slug: course.slug,
          description: course.description || '',
          status: course.status,
          level: course.level,
        });
      } catch {
        setError('Не удалось загрузить курс');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await updateCourse(courseId, form);
      router.push('/admin/courses');
    } catch {
      setError('Ошибка сохранения');
      setSaving(false);
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="admin-page">
      <h1>Редактирование курса</h1>

      {error && <div className="admin-error">{error}</div>}

      <form onSubmit={handleSubmit} className="admin-form">
        <label>
          Название
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </label>

        <label>
          Slug
          <input
            type="text"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
        </label>

        <label>
          Описание
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>

        <label>
          Статус
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as Course['status'] })}
          >
            <option value="draft">Черновик</option>
            <option value="published">Опубликован</option>
          </select>
        </label>

        <label>
          Уровень
          <select
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value as Course['level'] })}
          >
            <option value="beginner">Начинающий</option>
            <option value="intermediate">Средний</option>
            <option value="advanced">Продвинутый</option>
          </select>
        </label>

        <div className="form-actions">
          <button type="submit" disabled={saving} className="admin-button">
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/courses')}
            className="admin-button-secondary"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
