"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getMyEnrollments,
  getCourseProgress,
  type CourseProgressSummary,
} from "@/lib/api";
import "@/styles/public/cabinet.css";

export default function CabinetPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [summaries, setSummaries] = useState<CourseProgressSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    (async () => {
      try {
        const res = await getMyEnrollments();
        const items = res.items || [];
        const sums = await Promise.all(
          items.map((e) => getCourseProgress(e.course_id))
        );
        setSummaries(sums);
      } catch (err) {
        console.error("cabinet load failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || loading) {
    return (
      <div className="container">
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="container cabinet">
      <h1>Мой кабинет</h1>
      <p className="cabinet-email">{user?.email}</p>

      {summaries.length === 0 ? (
        <div className="empty-state">
          <p>Вы ещё не записаны ни на один курс.</p>
          <Link href="/courses" className="enroll-button">
            Выбрать курс
          </Link>
        </div>
      ) : (
        <div className="cabinet-courses">
          {summaries.map((s) => (
            <div key={s.course_id} className="cabinet-course">
              <div className="cabinet-course-head">
                <Link href={`/courses/${s.course_slug}`}>
                  <h3>{s.course_title}</h3>
                </Link>
                <span className="cabinet-percent">{s.percent}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${s.percent}%` }}
                />
              </div>
              <div className="cabinet-course-meta">
                <span>
                  {s.completed_count} / {s.total_lessons} уроков
                </span>
                <Link
                  href={`/courses/${s.course_slug}`}
                  className="continue-link"
                >
                  Продолжить →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
