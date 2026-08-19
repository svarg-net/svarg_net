// API функции для работы с постами

import { apiGet, apiPost, apiPatch, apiDelete } from "./client";
import type { Post, PostListResponse, PostCreateData, PostUpdateData } from "./types";

/**
 * Получение списка постов
 */
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

/**
 * Получение поста по slug
 */
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

/**
 * Получение постов по категории
 */
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

  const data = await apiGet<PostListResponse>(
    `/api/v1/categories/${categorySlug}/posts?${params}`
  );

  return {
    items: data.items || [],
    total: data.total || 0,
    page: data.page || page,
    per_page: data.per_page || perPage,
  };
}

/**
 * Получение постов по тегу
 */
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

  const data = await apiGet<PostListResponse>(
    `/api/v1/tags/${tagSlug}/posts?${params}`
  );

  return {
    items: data.items || [],
    total: data.total || 0,
    page: data.page || page,
    per_page: data.per_page || perPage,
  };
}

/**
 * Создание поста
 */
export async function createPost(
  token: string,
  data: PostCreateData
): Promise<Post> {
  // Удаляем undefined значения
  const cleanData: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      cleanData[key] = value;
    }
  });

  return apiPost<Post>("/api/v1/posts", token, cleanData);
}

/**
 * Обновление поста
 */
export async function updatePost(
  token: string,
  id: number,
  data: PostUpdateData
): Promise<Post> {
  // Удаляем undefined значения
  const cleanData: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      cleanData[key] = value;
    }
  });

  return apiPatch<Post>(`/api/v1/posts/${id}`, token, cleanData);
}

/**
 * Удаление поста
 */
export async function deletePost(token: string, id: number): Promise<void> {
  return apiDelete<void>(`/api/v1/posts/${id}`, token);
}