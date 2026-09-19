'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCourses, deleteCourse, type Course } from '@/lib/api';
import '@/styles/admin/courses.css';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await getCourses();
      setCourses(res.items || []);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Удалить курс "${title}"? Все уроки будут удалены.`)) return;
    try {
      await deleteCourse(id);
      fetchCourses();
    } catch (err) {
      alert('Ошибка удаления: ' + err);
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Курсы</h1>
        <Link href="/admin/courses/new" className="admin-button">
          + Новый курс
        </Link>
      </div>

      {courses.length === 0 ? (
        <p className="empty-state">Нет курсов. Создайте первый!</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Slug</th>
              <th>Статус</th>
              <th>Уровень</th>
              <th>Уроки</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>
                  <Link href={`/admin/courses/${c.id}/edit`}>{c.title}</Link>
                </td>
                <td><code>{c.slug}</code></td>
                <td>
                  <span className={`status-badge ${c.status}`}>
                    {c.status === 'published' ? '✅ Опубликован' : '📝 Черновик'}
                  </span>
                </td>
                <td>{c.level}</td>
                <td>{c.lesson_count || 0}</td>
                <td className="actions">
                  <Link href={`/admin/courses/${c.id}/edit`} className="btn-small">
                    ✏️
                  </Link>
                  <Link href={`/admin/courses/${c.id}/lessons`} className="btn-small">
                    📚
                  </Link>
                  <button onClick={() => handleDelete(c.id, c.title)} className="btn-small btn-danger">
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
