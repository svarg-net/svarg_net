import Link from 'next/link';
import { getPublicCourse, getPublicLesson, getPublicLessons } from '@/lib/api';
import LessonBlocks from '@/components/courses/LessonBlocks';
import '@/styles/public/courses.css';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}) {
  const { slug, lessonSlug } = await params;
  const course = await getPublicCourse(slug);
  const lesson = await getPublicLesson(slug, lessonSlug);
  const { items: lessons } = await getPublicLessons(slug);


  if (!course || !lesson || course.status !== 'published') {
    notFound();
  }

  const currentIndex = lessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  return (
    <div className="container lesson-page">
      <nav className="breadcrumb">
        <Link href="/courses">Курсы</Link>
        <span>→</span>
        <Link href={`/courses/${course.slug}`}>{course.title}</Link>
        <span>→</span>
        <span>{lesson.title}</span>
      </nav>

      <h1>{lesson.title}</h1>

      <div className="lesson-content">
        <LessonBlocks
          lessonId={lesson.id}
          courseSlug={course.slug}
          minScore={lesson.min_score}
        />
      </div>

      <nav className="lesson-navigation">
        {prevLesson ? (
          <Link href={`/courses/${course.slug}/${prevLesson.slug}`} className="nav-prev">
            <span className="nav-label">← Предыдущий</span>
            <span className="nav-title">{prevLesson.title}</span>
          </Link>
        ) : (
          <div />
        )}
        {nextLesson ? (
          <Link href={`/courses/${course.slug}/${nextLesson.slug}`} className="nav-next">
            <span className="nav-label">Следующий →</span>
            <span className="nav-title">{nextLesson.title}</span>
          </Link>
        ) : (
          <Link href={`/courses/${course.slug}`} className="nav-next">
            <span className="nav-label">← К программе курса</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
