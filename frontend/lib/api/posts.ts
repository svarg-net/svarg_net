// API функции для работы с постами

import { apiGet, apiPost, apiPatch, apiDelete } from "./client";
import type { Post, PostListResponse, PostCreateData, PostUpdateData } from "./types";

export async function getPosts(
  status: string = "published",
  page: number = 1,
  perPage: number = 20
): Promise<PostListResponse> {
  const params = new URLSearchParams({
    status,
    page: String(page),
    per_page: String(perPage),
  });

  const data = await apiGet<PostListResponse>(`/api/v1/posts?${params}`);

  return {
    items: data.items || [],
    total: data.total || 0,
    page: data.page || page,
    per_page: data.per_page || perPage,
  };
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    return await apiGet<Post>(`/api/v1/posts/${slug}`);
  } catch (error) {
    if ((error as Error).message.includes("not found")) {
      return null;
    }
    throw error;
  }
}

export async function getPostsByCategory(
  categorySlug: string,
  status: string = "published",
  page: number = 1,
  perPage: number = 20
): Promise<PostListResponse> {
  const params = new URLSearchParams({
    status,
    page: String(page),
    per_page: String(perPage),
  });

  return apiGet<PostListResponse>(`/api/v1/categories/${categorySlug}/posts?${params}`);
}

export async function getPostsByTag(
  tagSlug: string,
  status: string = "published",
  page: number = 1,
  perPage: number = 20
): Promise<PostListResponse> {
  const params = new URLSearchParams({
    status,
    page: String(page),
    per_page: String(perPage),
  });

  return apiGet<PostListResponse>(`/api/v1/tags/${tagSlug}/posts?${params}`);
}

export async function createPost(data: PostCreateData): Promise<Post> {
  const cleanData: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      cleanData[key] = value;
    }
  });

  return apiPost<Post>("/api/v1/posts", cleanData);
}

export async function updatePost(id: number, data: PostUpdateData): Promise<Post> {
  const cleanData: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      cleanData[key] = value;
    }
  });

  return apiPatch<Post>(`/api/v1/posts/${id}`, cleanData);
}

export async function deletePost(id: number): Promise<void> {
  return apiDelete<void>(`/api/v1/posts/${id}`);
}
