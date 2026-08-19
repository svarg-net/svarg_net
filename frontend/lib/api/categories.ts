// API функции для работы с категориями

import { apiGet, apiPost, apiPatch, apiDelete } from "./client";
import type { Category, CategoryListResponse, CategoryCreateData, CategoryUpdateData } from "./types";

/**
 * Получение списка категорий
 */
export async function getCategories(): Promise<CategoryListResponse> {
  const data = await apiGet<CategoryListResponse>("/api/v1/categories");

  return {
    items: data.items || [],
    total: data.total || 0,
  };
}

/**
 * Получение категории по slug
 */
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

/**
 * Создание категории
 */
export async function createCategory(
  token: string,
  data: CategoryCreateData
): Promise<Category> {
  return apiPost<Category>("/api/v1/categories", token, data);
}

/**
 * Обновление категории
 */
export async function updateCategory(
  token: string,
  id: number,
  data: CategoryUpdateData
): Promise<Category> {
  return apiPatch<Category>(`/api/v1/categories/${id}`, token, data);
}

/**
 * Удаление категории
 */
export async function deleteCategory(token: string, id: number): Promise<void> {
  return apiDelete<void>(`/api/v1/categories/${id}`, token);
}