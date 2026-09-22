'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getPublicLessonBlocks, markLessonComplete } from '@/lib/api';
import BlockRenderer from '@/components/blocks/BlockRenderer';
import type { Block } from '@/lib/api/public/blocks';

interface Props {
  lessonId: number;
  courseSlug: string;
  minScore: number;
}

export default function LessonBlocks({ lessonId, courseSlug, minScore }: Props) {
  const { user, isLoading } = useAuth();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getPublicLessonBlocks(lessonId);
        setBlocks(res.items || []);

        // Урок без теста → засчитываем как прочитанный (если студент записан)
        if (user && minScore === 0) {
          markLessonComplete(lessonId).catch(() => {
            // не записан на курс или ошибка — молча пропускаем
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Ошибка загрузки';
        if (message.includes('403') || message.includes('enrollment')) {
          setError('enrollment_required');
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    };

    // Ждём, пока auth загрузится
    if (!isLoading) {
      load();
    }
  }, [lessonId, isLoading, user, minScore]);

  if (isLoading || loading) {
    return <p>Загрузка содержимого урока...</p>;
  }

  if (error === 'enrollment_required') {
    return (
      <div className="locked-lesson">
        <div className="locked-icon">🔒</div>
        <h3>Урок доступен после записи на курс</h3>
        <p>Запишитесь на курс, чтобы открыть все уроки и тесты.</p>
        <a href={`/courses/${courseSlug}`} className="enroll-button">
          Перейти к курсу
        </a>
      </div>
    );
  }

  if (error) {
    return <p className="admin-error">{error}</p>;
  }

  if (blocks.length === 0) {
    return <p>Содержимое урока ещё не добавлено.</p>;
  }

  return <BlockRenderer blocks={blocks} />;
}
