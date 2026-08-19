// Базовый API клиент
// Определяет URL API в зависимости от окружения (server/client)

const SERVER_API_URL = process.env.BACKEND_URL || "http://localhost:8080";
const CLIENT_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const isServer = typeof window === "undefined";

/**
 * Возвращает URL API в зависимости от окружения
 * На сервере используется BACKEND_URL (внутренний адрес Docker)
 * На клиенте используется NEXT_PUBLIC_API_URL
 */
export function getApiUrl(): string {
  return isServer ? SERVER_API_URL : CLIENT_API_URL;
}

/**
 * Выполняет fetch запрос и обрабатывает ошибки
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${getApiUrl()}${endpoint}`, {
    cache: "no-store",
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `API error: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // Если не удалось распарсить JSON, используем статус
    }
    throw new Error(errorMessage);
  }

  // Для 204 No Content возвращаем null
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

/**
 * Выполняет GET запрос
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: "GET",
  });
}

/**
 * Выполняет POST запрос с авторизацией
 */
export async function apiPost<T>(
  endpoint: string,
  token: string,
  data: unknown
): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

/**
 * Выполняет PATCH запрос с авторизацией
 */
export async function apiPatch<T>(
  endpoint: string,
  token: string,
  data: unknown
): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

/**
 * Выполняет DELETE запрос с авторизацией
 */
export async function apiDelete<T = void>(
  endpoint: string,
  token: string
): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}