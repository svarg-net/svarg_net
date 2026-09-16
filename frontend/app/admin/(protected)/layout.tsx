import RequireAuth from "@/components/RequireAuth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import "@/styles/admin/layout.css";
import "@/styles/admin/base.css";

export default function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth requiredRole="admin" redirectTo="/">
      <div className="admin-layout">
        <AdminSidebar />
        <main className="admin-main">{children}</main>
      </div>
    </RequireAuth>
  );
}
