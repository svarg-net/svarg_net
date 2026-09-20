import { apiGet } from '../client';
import type { Course, Lesson } from '../types';
import type { Block } from './blocks';

export async function getPublicCourses(): Promise<{ items: Course[] }> {
  return apiGet<{ items: Course[] }>('/api/v1/courses?status=published');
}

export async function getPublicCourse(slug: string): Promise<Course> {
  return apiGet<Course>(`/api/v1/courses/${slug}`);
}

export async function getPublicLessons(courseSlug: string): Promise<{ items: Lesson[] }> {
  return apiGet<{ items: Lesson[] }>(`/api/v1/courses/${courseSlug}/lessons`);
}

export async function getPublicLesson(
  courseSlug: string,
  lessonSlug: string
): Promise<Lesson> {
  return apiGet<Lesson>(`/api/v1/courses/${courseSlug}/lessons/${lessonSlug}`);
}

export async function getPublicLessonBlocks(lessonId: number): Promise<{ items: Block[] }> {
  return apiGet<{ items: Block[] }>(`/api/v1/lessons/${lessonId}/blocks`);
}
