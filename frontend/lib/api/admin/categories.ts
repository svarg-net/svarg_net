import { apiPost, apiPatch, apiDelete } from "../client";
import type { Category, CategoryCreateData, CategoryUpdateData } from "../types";

export * from "../public/categories";

export async function createCategory(data: CategoryCreateData): Promise<Category> {
  return apiPost<Category>("/api/v1/categories", data);
}

export async function updateCategory(id: number, data: CategoryUpdateData): Promise<Category> {
  return apiPatch<Category>(`/api/v1/categories/${id}`, data);
}

export async function deleteCategory(id: number): Promise<void> {
  return apiDelete<void>(`/api/v1/categories/${id}`);
}
