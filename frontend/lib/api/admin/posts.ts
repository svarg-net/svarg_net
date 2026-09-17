import { apiPost, apiPatch, apiDelete } from "../client";
import type { Post, PostCreateData, PostUpdateData } from "../types";

export * from "../public/posts";

export async function createPost(data: PostCreateData): Promise<Post> {
  const cleanData: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) cleanData[key] = value;
  });
  return apiPost<Post>("/api/v1/posts", cleanData);
}

export async function updatePost(id: number, data: PostUpdateData): Promise<Post> {
  const cleanData: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) cleanData[key] = value;
  });
  return apiPatch<Post>(`/api/v1/posts/${id}`, cleanData);
}

export async function deletePost(id: number): Promise<void> {
  return apiDelete<void>(`/api/v1/posts/${id}`);
}
