import Link from 'next/link';
import { getPublicCourses } from '@/lib/api';
import '@/styles/public/courses.css';

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
  const { items: courses } = await getPublicCourses();

  return (
    <div className="container">
      <h1>Курсы</h1>
      <p className="lead">Изучай программирование через практику</p>

      {courses.length === 0 ? (
        <p>Пока нет доступных курсов.</p>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="course-card"
            >
              <div className="course-content">
                <h2>{course.title}</h2>
                <p>{course.description}</p>
                <div className="course-meta">
                  <span className="level">{course.level}</span>
                  <span className="lessons">{course.lesson_count} уроков</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
