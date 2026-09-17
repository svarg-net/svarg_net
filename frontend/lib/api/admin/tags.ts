import { apiPost, apiPatch, apiDelete } from "../client";
import type { Tag, TagCreateData, TagUpdateData } from "../types";

export * from "../public/tags";

export async function createTag(data: TagCreateData): Promise<Tag> {
  return apiPost<Tag>("/api/v1/tags", data);
}

export async function updateTag(id: number, data: TagUpdateData): Promise<Tag> {
  return apiPatch<Tag>(`/api/v1/tags/${id}`, data);
}

export async function deleteTag(id: number): Promise<void> {
  return apiDelete<void>(`/api/v1/tags/${id}`);
}
