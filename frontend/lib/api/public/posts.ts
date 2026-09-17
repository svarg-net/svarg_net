import { apiGet } from "../client";
import type { Post, PostListResponse } from "../types";

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
    if ((error as Error).message.includes("not found")) return null;
    throw error;
  }
}

export async function getPostsByCategory(
  categorySlug: string,
  status: string = "published",
  page = 1,
  perPage = 20
): Promise<PostListResponse> {
  const params = new URLSearchParams({
    status,
    page: String(page),
    per_page: String(perPage),
  });
  return apiGet<PostListResponse>(
    `/api/v1/categories/${categorySlug}/posts?${params}`
  );
}

export async function getPostsByTag(
  tagSlug: string,
  status: string = "published",
  page = 1,
  perPage = 20
): Promise<PostListResponse> {
  const params = new URLSearchParams({
    status,
    page: String(page),
    per_page: String(perPage),
  });
  return apiGet<PostListResponse>(`/api/v1/tags/${tagSlug}/posts?${params}`);
}
