// API функции для работы с тегами

import { apiGet, apiPost, apiPatch, apiDelete } from "./client";
import type { Tag, TagListResponse, TagCreateData, TagUpdateData } from "./types";

export async function getTags(): Promise<TagListResponse> {
  return apiGet<TagListResponse>("/api/v1/tags");
}

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

export async function createTag(data: TagCreateData): Promise<Tag> {
  return apiPost<Tag>("/api/v1/tags", data);
}

export async function updateTag(id: number, data: TagUpdateData): Promise<Tag> {
  return apiPatch<Tag>(`/api/v1/tags/${id}`, data);
}

export async function deleteTag(id: number): Promise<void> {
  return apiDelete<void>(`/api/v1/tags/${id}`);
}
