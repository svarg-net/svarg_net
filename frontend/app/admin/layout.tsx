import { AuthProvider } from "@/context/AuthContext";
import "@/styles/admin.css";

// Базовый layout для всей админки
// Только AuthProvider — защита в (protected)/layout.tsx
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
