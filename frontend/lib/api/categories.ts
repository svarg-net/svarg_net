// API функции для работы с категориями

import { apiGet, apiPost, apiPatch, apiDelete } from "./client";
import type { Category, CategoryListResponse, CategoryCreateData, CategoryUpdateData } from "./types";

export async function getCategories(): Promise<CategoryListResponse> {
  return apiGet<CategoryListResponse>("/api/v1/categories");
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    return await apiGet<Category>(`/api/v1/categories/${slug}`);
  } catch (error) {
    if ((error as Error).message.includes("not found")) {
      return null;
    }
    throw error;
  }
}

export async function createCategory(data: CategoryCreateData): Promise<Category> {
  return apiPost<Category>("/api/v1/categories", data);
}

export async function updateCategory(id: number, data: CategoryUpdateData): Promise<Category> {
  return apiPatch<Category>(`/api/v1/categories/${id}`, data);
}

export async function deleteCategory(id: number): Promise<void> {
  return apiDelete<void>(`/api/v1/categories/${id}`);
}
