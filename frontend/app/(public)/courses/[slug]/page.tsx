import Link from 'next/link';
import EnrollButton from '@/components/courses/EnrollButton';
import CourseLessonsList from '@/components/courses/CourseLessonsList';
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

      <div className="enroll-section">
        <EnrollButton courseId={course.id} courseSlug={course.slug} />
      </div>

      <h2>Программа курса</h2>
      <CourseLessonsList
        courseId={course.id}
        courseSlug={course.slug}
        lessons={lessons}
      />

      <div className="back-link">
        <Link href="/courses">← Все курсы</Link>
      </div>
    </div>
  );
}
