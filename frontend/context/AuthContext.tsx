"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  login as apiLogin,
  logout as apiLogout,
  silentRefresh,
} from "@/lib/api/auth";
import type { User } from "@/lib/api/types";

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Провайдер аутентификации.
 * Оборачивает приложение (или его часть) для обеспечения:
 * - Silent refresh при загрузке страницы (восстановление сессии из httpOnly cookie)
 * - Глобального доступа к текущему пользователю
 * - Функций login/logout
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Silent refresh при первой загрузке компонента
  useEffect(() => {
    const init = async () => {
      try {
        // Пытаемся восстановить сессию используя httpOnly cookie
        const result = await silentRefresh();
        if (result) {
          setUser(result.user);
        }
      } catch {
        // Сессии нет — это нормально для неавторизованного пользователя
        // No active session — normal for unauthenticated user
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Хук для доступа к состоянию аутентификации.
 * Должен использоваться внутри AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
