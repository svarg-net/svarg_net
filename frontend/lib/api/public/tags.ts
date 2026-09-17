import { apiGet } from "../client";
import type { Tag, TagListResponse } from "../types";

export async function getTags(): Promise<TagListResponse> {
  return apiGet<TagListResponse>("/api/v1/tags");
}

export async function getTagBySlug(slug: string): Promise<Tag | null> {
  try {
    return await apiGet<Tag>(`/api/v1/tags/${slug}`);
  } catch (error) {
    if ((error as Error).message.includes("not found")) return null;
    throw error;
  }
}
