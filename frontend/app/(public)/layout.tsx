export const dynamic = "force-dynamic";
import type { ReactNode } from "react";
import Sidebar from "@/components/site/Sidebar";
import "@/styles/sidebar.css";
import "@/styles/public.css";
import SearchBar from "@/components/site/SearchBar";

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
        <SearchBar />
        {children}
      </main>
    </div>
  );
}