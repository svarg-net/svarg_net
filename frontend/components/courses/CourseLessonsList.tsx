"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getMyLessonsProgress } from "@/lib/api";
import type { Lesson } from "@/lib/api";

interface Props {
  courseId: number;
  courseSlug: string;
  lessons: Lesson[];
}

export default function CourseLessonsList({ courseId, courseSlug, lessons }: Props) {
  const { user, isLoading } = useAuth();
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isLoading || !user) return;
    (async () => {
      try {
        const res = await getMyLessonsProgress(courseId);
        setCompletedIds(
          new Set(
            (res.items || [])
              .filter((p) => p.completed_at)
              .map((p) => p.lesson_id)
          )
        );
      } catch {
        // не залогинен или ошибка — просто без галочек
      }
    })();
  }, [user, isLoading, courseId]);

  if (lessons.length === 0) return <p>Уроки пока не добавлены.</p>;

  return (
    <ol className="lessons-list">
      {lessons.map((lesson, idx) => (
        <li key={lesson.id}>
          <Link
            href={`/courses/${courseSlug}/${lesson.slug}`}
            className="lesson-item"
          >
            <span className="lesson-number">{idx + 1}</span>
            <div className="lesson-content">
              <h3>
                {lesson.title}
                {completedIds.has(lesson.id) && (
                  <span className="done-mark">✅</span>
                )}
              </h3>
              <div className="lesson-meta">
                {lesson.is_free ? (
                  <span className="free-badge">🔓 Бесплатно</span>
                ) : (
                  <span className="locked-badge">🔒 Требуется запись</span>
                )}
                {lesson.min_score > 0 && <span>Тест: {lesson.min_score}%</span>}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}
