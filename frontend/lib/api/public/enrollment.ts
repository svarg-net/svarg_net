import { apiGet, apiPost } from '../client';
import type { Course } from '../types';

export interface Enrollment {
  id: number;
  user_id: number;
  course_id: number;
  enrolled_at: string;
  course?: Course;
}

export interface CourseProgressSummary {
  course_id: number;
  course_title: string;
  course_slug: string;
  total_lessons: number;
  completed_count: number;
  percent: number;
  last_lesson_slug?: string;
  last_lesson_title?: string;
}

export interface LessonProgressState {
  id?: number;
  user_id?: number;
  lesson_id?: number;
  quiz_score?: number | null;
  completed_at?: string | null;
  completed: boolean;
}

// === Enrollments ===

export async function enrollInCourse(slug: string): Promise<Enrollment> {
  const res = await apiPost<{ enrollment: Enrollment; message: string }>(
    `/api/v1/courses/${slug}/enroll`,
    {}
  );
  return res.enrollment;
}

export async function getMyEnrollments(): Promise<{ items: Enrollment[]; total: number }> {
  return apiGet<{ items: Enrollment[]; total: number }>('/api/v1/me/enrollments');
}

export async function getEnrollmentStatus(courseId: number): Promise<{ enrolled: boolean }> {
  return apiGet<{ enrolled: boolean }>(`/api/v1/courses/${courseId}/enrollment-status`);
}

// === Progress ===

export async function markLessonComplete(lessonId: number): Promise<LessonProgressState> {
  return apiPost<LessonProgressState>(`/api/v1/lessons/${lessonId}/complete`, {});
}

export async function submitQuiz(
  lessonId: number,
  score: number
): Promise<LessonProgressState> {
  return apiPost<LessonProgressState>(`/api/v1/lessons/${lessonId}/quiz`, { score });
}

export async function getCourseProgress(courseId: number): Promise<CourseProgressSummary> {
  return apiGet<CourseProgressSummary>(`/api/v1/me/courses/${courseId}/progress`);
}

export async function getLessonProgress(lessonId: number): Promise<LessonProgressState> {
  return apiGet<LessonProgressState>(`/api/v1/lessons/${lessonId}/progress`);
}

export interface LessonProgressItem {
  id: number;
  user_id: number;
  lesson_id: number;
  quiz_score: number | null;
  completed_at: string | null;
  updated_at: string;
}

export async function getMyLessonsProgress(
  courseId: number
): Promise<{ items: LessonProgressItem[] }> {
  return apiGet<{ items: LessonProgressItem[] }>(
    `/api/v1/me/courses/${courseId}/lessons-progress`
  );
}
