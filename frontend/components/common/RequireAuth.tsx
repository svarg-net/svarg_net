"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type Props = {
  children: React.ReactNode;
  requiredRole?: "admin" | "student";
  redirectTo?: string;
};

export default function RequireAuth({
  children,
  requiredRole,
  redirectTo = "/login",
}: Props) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router, redirectTo]);

  if (isLoading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>Загрузка...</div>
    );
  }

  if (!isAuthenticated) return null;
  if (requiredRole && user?.role !== requiredRole) return null;

  return <>{children}</>;
}
