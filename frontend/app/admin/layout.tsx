import "@/styles/admin/base.css";

// Базовый layout для всей админки
// AuthProvider теперь в корневом layout; защита ролей в (protected)/layout.tsx
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
