// Базовый API клиент с поддержкой Memory + Refresh Token схемы

import { setAccessToken, getAccessTokenUnsafe } from "@/lib/auth";

const SERVER_API_URL = process.env.BACKEND_URL || "http://localhost:8080";

const isServer = typeof window === "undefined";

/**
 * Возвращает URL API в зависимости от окружения
 */
export function getApiUrl(): string {
  return isServer ? SERVER_API_URL : "";
}

// Флаг для предотвращения одновременных refresh запросов
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

function onRefreshed(token: string | null): void {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string | null) => void): void {
  refreshSubscribers.push(callback);
}

/**
 * Пытается обновить access token используя refresh cookie
 * Возвращает новый access token или null при неудаче
 */
async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(`${getApiUrl()}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include", // ✅ Отправляем httpOnly cookie
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.access_token) {
      setAccessToken(data.access_token, data.expires_in);
      return data.access_token;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Выполняет fetch запрос с автоматическим refresh при 401
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Не делаем refresh на сервере (SSR)
  const isClientSide = typeof window !== "undefined";

  const makeRequest = async (token: string | null): Promise<Response> => {
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(`${getApiUrl()}${endpoint}`, {
      ...options,
      headers,
      credentials: isClientSide ? "include" : "omit", // ✅ Для браузера отправляем cookie
      cache: "no-store",
    });
  };

  // Первый запрос с текущим токеном
  let token = getAccessTokenUnsafe();
  let response = await makeRequest(token);

  // Если 401 и мы на клиенте — пробуем refresh
  if (response.status === 401 && isClientSide && !endpoint.includes("/auth/refresh")) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;
      onRefreshed(newToken);

      if (!newToken) {
        // Refresh не удался — перенаправляем на логин
        if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
          window.location.href = "/admin/login";
        }
        throw new Error("Session expired");
      }

      // Повторяем запрос с новым токеном
      response = await makeRequest(newToken);
    } else {
      // Другой запрос уже делает refresh — ждём
      const newToken = await new Promise<string | null>((resolve) => {
        addRefreshSubscriber(resolve);
      });

      if (!newToken) {
        throw new Error("Session expired");
      }

      response = await makeRequest(newToken);
    }
  }

  if (!response.ok) {
    let errorMessage = `API error: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // Игнорируем ошибку парсинга
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

/**
 * GET запрос (без авторизации или с токеном в памяти)
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: "GET",
  });
}

/**
 * POST запрос
 */
export async function apiPost<T>(endpoint: string, data: unknown): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

/**
 * PATCH запрос
 */
export async function apiPatch<T>(endpoint: string, data: unknown): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

/**
 * DELETE запрос
 */
export async function apiDelete<T = void>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: "DELETE",
  });
}
