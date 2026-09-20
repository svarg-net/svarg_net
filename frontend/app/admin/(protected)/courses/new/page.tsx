'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCourse, type Course } from '@/lib/api';

export default function NewCoursePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    status: 'draft' as Course['status'],
    level: 'beginner' as Course['level'],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Автогенерация slug из title
  const handleTitleChange = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[а-яё]/gi, (c) => {
        const map: Record<string, string> = {
          'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
          'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
          'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
          'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
          'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        };
        return map[c.toLowerCase()] || '';
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setForm({ ...form, title, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const course = await createCourse(form);
      router.push(`/admin/courses/${course.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания');
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <h1>Новый курс</h1>

      {error && <div className="admin-error">{error}</div>}

      <form onSubmit={handleSubmit} className="admin-form">
        <label>
          Название
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
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
            {saving ? 'Создание...' : 'Создать курс'}
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
