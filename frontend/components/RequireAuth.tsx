"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type RequireAuthProps = {
  children: React.ReactNode;
  redirectTo?: string;
};

/**
 * Компонент-обёртка для защиты админских страниц.
 * - Пока идёт проверка сессии — показывает "Загрузка..."
 * - Если сессии нет — редиректит на страницу логина
 * - Если сессия есть — рендерит дочерние компоненты
 */
export default function RequireAuth({
  children,
  redirectTo = "/admin/login",
}: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Не делаем редирект если уже на странице логина
    if (!isLoading && !isAuthenticated && pathname !== redirectTo) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, pathname, redirectTo]);

  if (isLoading) {
    return (
      <div className="admin-container">
        <p>Загрузка сессии...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Во время редиректа ничего не показываем
    return null;
  }

  return <>{children}</>;
}
