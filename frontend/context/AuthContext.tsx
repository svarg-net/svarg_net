"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiGet, apiPost } from "@/lib/api/client";

export interface User {
  id: number;
  email: string;
  role: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await apiGet<{ user: User }>("/api/v1/auth/me");
      setUser(res.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    await apiPost("/api/v1/auth/login", { email, password });
    await fetchUser();
  };

  const register = async (email: string, password: string) => {
    await apiPost("/api/v1/auth/register", { email, password });
    await fetchUser();
  };

  const logout = async () => {
    await apiPost("/api/v1/auth/logout", {});
    setUser(null);
  };

  const refresh = fetchUser;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: loading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
