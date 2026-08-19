// API функции для работы с тегами

import { apiGet, apiPost, apiPatch, apiDelete } from "./client";
import type { Tag, TagListResponse, TagCreateData, TagUpdateData } from "./types";

/**
 * Получение списка тегов
 */
export async function getTags(): Promise<TagListResponse> {
  const data = await apiGet<TagListResponse>("/api/v1/tags");

  return {
    items: data.items || [],
    total: data.total || 0,
  };
}

/**
 * Получение тега по slug
 */
export async function getTagBySlug(slug: string): Promise<Tag | null> {
  try {
    return await apiGet<Tag>(`/api/v1/tags/${slug}`);
  } catch (error) {
    if ((error as Error).message.includes("not found")) {
      return null;
    }
    throw error;
  }
}

/**
 * Создание тега
 */
export async function createTag(
  token: string,
  data: TagCreateData
): Promise<Tag> {
  return apiPost<Tag>("/api/v1/tags", token, data);
}

/**
 * Обновление тега
 */
export async function updateTag(
  token: string,
  id: number,
  data: TagUpdateData
): Promise<Tag> {
  return apiPatch<Tag>(`/api/v1/tags/${id}`, token, data);
}

/**
 * Удаление тега
 */
export async function deleteTag(token: string, id: number): Promise<void> {
  return apiDelete<void>(`/api/v1/tags/${id}`, token);
}