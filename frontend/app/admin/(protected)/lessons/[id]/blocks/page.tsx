'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import BlockEditor, { type BlockEditorApi } from '@/components/blocks/BlockEditor';
import {
  getLesson,
  getLessonBlocks,
  createLessonBlock,
  updateLessonBlock,
  deleteLessonBlock,
  reorderLessonBlocks,
  type Lesson,
} from '@/lib/api';

const lessonBlocksApi: BlockEditorApi = {
  getBlocks: async (ownerId) => {
    const res = await getLessonBlocks(ownerId);
    return res.items || [];
  },
  createBlock: (ownerId, data) => createLessonBlock(ownerId, data),
  updateBlock: (id, data) => updateLessonBlock(id, data),
  deleteBlock: deleteLessonBlock,
  reorderBlocks: reorderLessonBlocks,
};

export default function LessonBlocksPage() {
  const params = useParams();
  const lessonId = Number(params.id);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const l = await getLesson(lessonId);
        setLesson(l);
      } catch {
        // оставим null — редактор покажет ошибку сам
      } finally {
        setLoading(false);
      }
    })();
  }, [lessonId]);

  if (loading) return <div className="admin-page">Загрузка...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>
          Блоки урока{' '}
          {lesson && <span style={{ fontWeight: 400, color: '#667085' }}>— {lesson.title}</span>}
        </h1>
        <Link
          href={lesson ? `/admin/courses/${lesson.course_id}/lessons` : '/admin/courses'}
          className="admin-button-secondary"
        >
          ← К урокам
        </Link>
      </div>

      <BlockEditor postId={lessonId} api={lessonBlocksApi} />
    </div>
  );
}
