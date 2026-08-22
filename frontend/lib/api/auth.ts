// API функции для аутентификации

import { apiFetch } from "./client";
import type { LoginResponse, User } from "./types";

/**
 * Вход пользователя
 */
export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Получение текущего пользователя по токену
 */
export async function getMe(token: string): Promise<User> {
  const response = await apiFetch<{ user: User }>("/api/v1/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.user;
}