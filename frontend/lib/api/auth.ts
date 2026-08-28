// API функции для аутентификации

import { setAccessToken, clearAccessToken } from "@/lib/auth";
import { getApiUrl } from "./client";
import type { User } from "./types";

type LoginResponse = {
  access_token: string;
  expires_in: number;
  user: User;
};

type RefreshResponse = {
  access_token: string;
  expires_in: number;
};

/**
 * Вход пользователя
 * Access token возвращается в JSON, refresh token устанавливается как httpOnly cookie
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${getApiUrl()}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // ✅ Для получения httpOnly cookie
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    let errorMessage = "Login failed";
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  const data: LoginResponse = await response.json();
  
  // Сохраняем access token в память
  setAccessToken(data.access_token, data.expires_in);
  
  return data;
}

/**
 * Silent refresh — пытается восстановить сессию используя refresh cookie
 * Используется при загрузке страницы
 */
export async function silentRefresh(): Promise<LoginResponse | null> {
  try {
    const response = await fetch(`${getApiUrl()}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data: RefreshResponse = await response.json();
    setAccessToken(data.access_token, data.expires_in);

    // Получаем пользователя
    const user = await getMe();
    
    return {
      access_token: data.access_token,
      expires_in: data.expires_in,
      user,
    };
  } catch {
    return null;
  }
}

/**
 * Получение текущего пользователя по access token
 */
export async function getMe(): Promise<User> {
  const response = await fetch(`${getApiUrl()}/api/v1/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to get user");
  }

  const data = await response.json();
  return data.user;
}

// Импорт здесь, чтобы избежать circular dependency
import { getAccessToken } from "@/lib/auth";

/**
 * Logout — отзывает refresh token и удаляет cookie
 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${getApiUrl()}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } finally {
    clearAccessToken();
  }
}
