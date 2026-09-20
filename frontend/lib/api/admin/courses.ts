import { apiGet, apiPost, apiPatch, apiDelete } from '../client';
import type { Course, Lesson } from '../types';
import type { Block } from '../public/blocks';

export interface CourseListResponse {
  items: Course[];
  total: number;
}

export interface LessonListResponse {
  items: Lesson[];
  total: number;
}

export async function getCourses(status?: string): Promise<CourseListResponse> {
  const params = status ? `?status=${status}` : '';
  return apiGet<CourseListResponse>(`/api/v1/admin/courses${params}`);
}

export async function getCourse(id: number): Promise<Course> {
  return apiGet<Course>(`/api/v1/admin/courses/${id}`);
}

export async function createCourse(data: Partial<Course>): Promise<Course> {
  return apiPost<Course>('/api/v1/admin/courses', data);
}

export async function updateCourse(id: number, data: Partial<Course>): Promise<Course> {
  return apiPatch<Course>(`/api/v1/admin/courses/${id}`, data);
}

export async function deleteCourse(id: number): Promise<void> {
  await apiDelete(`/api/v1/admin/courses/${id}`);
}

export async function getLessons(courseId: number): Promise<LessonListResponse> {
  return apiGet<LessonListResponse>(`/api/v1/admin/courses/${courseId}/lessons`);
}

export async function createLesson(courseId: number, data: Partial<Lesson>): Promise<Lesson> {
  return apiPost<Lesson>(`/api/v1/admin/courses/${courseId}/lessons`, data);
}

export async function updateLesson(id: number, data: Partial<Lesson>): Promise<Lesson> {
  return apiPatch<Lesson>(`/api/v1/admin/lessons/${id}`, data);
}

export async function deleteLesson(id: number): Promise<void> {
  await apiDelete(`/api/v1/admin/lessons/${id}`);
}

export async function reorderLessons(courseId: number, lessonIds: number[]): Promise<void> {
  await apiPost(`/api/v1/admin/courses/${courseId}/lessons/reorder`, { lesson_ids: lessonIds });
}

export async function getLessonBlocks(lessonId: number): Promise<{ items: Block[] }> {
  return apiGet<{ items: Block[] }>(`/api/v1/admin/lessons/${lessonId}/blocks`);
}

export async function createLessonBlock(
  lessonId: number,
  data: { type: string; data?: Record<string, unknown>; position?: number }
): Promise<Block> {
  return apiPost<Block>(`/api/v1/admin/lessons/${lessonId}/blocks`, data);
}

export async function updateLessonBlock(
  id: number,
  data: { type?: string; data?: Record<string, unknown> }
): Promise<Block> {
  return apiPatch<Block>(`/api/v1/admin/lesson-blocks/${id}`, data);
}

export async function deleteLessonBlock(id: number): Promise<void> {
  await apiDelete(`/api/v1/admin/lesson-blocks/${id}`);
}

export async function reorderLessonBlocks(lessonId: number, blockIds: number[]): Promise<void> {
  await apiPost(`/api/v1/admin/lessons/${lessonId}/blocks/reorder`, { block_ids: blockIds });
}

// (getCourse/getLessons/etc уже экспортируются выше — это getLessonById)
export async function getLesson(id: number): Promise<Lesson> {
  return apiGet<Lesson>(`/api/v1/admin/lessons/${id}`);
}
