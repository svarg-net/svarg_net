import RequireAuth from "@/components/RequireAuth";

// Защищает все страницы в route group (protected)
export default function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth>{children}</RequireAuth>;
}
