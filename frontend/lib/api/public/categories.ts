import { apiGet } from "../client";
import type { Category, CategoryListResponse } from "../types";

export async function getCategories(): Promise<CategoryListResponse> {
  return apiGet<CategoryListResponse>("/api/v1/categories");
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    return await apiGet<Category>(`/api/v1/categories/${slug}`);
  } catch (error) {
    if ((error as Error).message.includes("not found")) return null;
    throw error;
  }
}
