import { getAccessTokenUnsafe } from "../auth";
import { apiGet, apiDelete } from "./client";

export type MediaFile = {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  path: string;
  uploaded_by?: number;
  created_at: string;
  url: string;
};

type MediaListResponse = {
  items: MediaFile[];
  total: number;
};

export async function getMedia(limit = 50, offset = 0): Promise<MediaListResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  return apiGet<MediaListResponse>(`/api/v1/media?${params}`);
}

export async function deleteMedia(id: number): Promise<void> {
  return apiDelete<void>(`/api/v1/media/${id}`);
}

/**
 * Загрузка файла через fetch (нужен multipart/form-data)
 * Не используем apiPost потому что он устанавливает Content-Type: application/json
 */
export async function uploadMedia(file: File): Promise<MediaFile> {
  const formData = new FormData();
  formData.append("file", file);

  const token = getAccessTokenUnsafe();
  const headers: HeadersInit = {};
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch("/api/v1/media", {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    let errorMsg = "Failed to upload file";
    try {
      const errData = await response.json();
      errorMsg = errData.error || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Форматирует размер файла для отображения
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
