import type { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import "@/styles/sidebar.css";
import "@/styles/public.css";

export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="site-layout">
      {/* Sidebar только для публичной части */}
      <Sidebar />

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}