import Link from 'next/link';
import { getPublicCourse, getPublicLessons } from '@/lib/api';
import '@/styles/public/courses.css';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getPublicCourse(slug);
  const { items: lessons } = await getPublicLessons(slug);

  if (!course || course.status !== 'published') {
    notFound();
  }

  return (
    <div className="container">
      <h1>{course.title}</h1>
      <p className="description">{course.description}</p>

      <div className="course-stats">
        <span>📚 {lessons.length} уроков</span>
        <span>🎯 Уровень: {course.level}</span>
      </div>

      <h2>Программа курса</h2>
      {lessons.length === 0 ? (
        <p>Уроки пока не добавлены.</p>
      ) : (
        <ol className="lessons-list">
          {lessons.map((lesson, idx) => (
            <li key={lesson.id}>
              <Link
                href={`/courses/${course.slug}/${lesson.slug}`}
                className="lesson-item"
              >
                <span className="lesson-number">{idx + 1}</span>
                <div className="lesson-content">
                  <h3>{lesson.title}</h3>
                  <div className="lesson-meta">
                    {lesson.is_free ? (
                      <span className="free-badge">🔓 Бесплатно</span>
                    ) : (
                      <span className="locked-badge">🔒 Требуется запись</span>
                    )}
                    {lesson.min_score > 0 && (
                      <span>Тест: {lesson.min_score}%</span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <div className="back-link">
        <Link href="/courses">← Все курсы</Link>
      </div>
    </div>
  );
}
