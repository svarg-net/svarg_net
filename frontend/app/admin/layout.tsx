import type { ReactNode } from "react";
import "@/styles/admin.css";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="admin-layout">
      {children}
    </div>
  );
}