'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { enrollInCourse, getEnrollmentStatus } from '@/lib/api';

interface Props {
  courseId: number;
  courseSlug: string;
}

export default function EnrollButton({ courseId, courseSlug }: Props) {
  const { user, isLoading, refresh } = useAuth();
  const [enrolled, setEnrolled] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!user) {
        setChecking(false);
        return;
      }
      try {
        const res = await getEnrollmentStatus(courseId);
        setEnrolled(res.enrolled);
      } catch {
        setEnrolled(false);
      } finally {
        setChecking(false);
      }
    };
    check();
  }, [user, courseId]);

  if (isLoading || checking) return null;

  if (!user) {
    return (
      <a href="/login" className="enroll-button">
        Войдите, чтобы записаться
      </a>
    );
  }

  if (enrolled) {
    return (
      <span className="enrolled-badge">
        ✅ Вы записаны на курс
      </span>
    );
  }

  const handleEnroll = async () => {
    setBusy(true);
    try {
      await enrollInCourse(courseSlug);
      setEnrolled(true);
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка записи');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button onClick={handleEnroll} disabled={busy} className="enroll-button">
      {busy ? 'Записываем...' : '📝 Записаться на курс'}
    </button>
  );
}
