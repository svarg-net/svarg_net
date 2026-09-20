"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiPost } from "@/lib/api/client";

const NAV_ITEMS = [
  { href: "/admin/posts", icon: "📝", title: "Посты" },
  { href: "/admin/categories", icon: "📁", title: "Категории" },
  { href: "/admin/tags", icon: "🏷️", title: "Теги" },
  { href: "/admin/media", icon: "🖼️", title: "Медиа" },
  { href: "/admin/comments", icon: "💬", title: "Комментарии" },
  { href: "/admin/polls", icon: "🗳", title: "Опросы" },
  { href: "/admin/stats", icon: "📊", title: "Статистика" },
  { href: "/admin/courses", icon: "📚", title: "Курсы" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await apiPost("/api/v1/auth/logout", {});
    } catch {
      // игнорируем
    }
    router.push("/");
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <Link href="/">← На сайт</Link>
      </div>

      <nav className="admin-sidebar-nav">
        <Link
          href="/admin"
          className={
            "admin-nav-item" + (pathname === "/admin" ? " is-active" : "")
          }
        >
          <span className="admin-nav-icon">🏠</span>
          <span>Главная</span>
        </Link>

        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={"admin-nav-item" + (active ? " is-active" : "")}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer">
        <button
          type="button"
          className="admin-nav-item admin-logout"
          onClick={handleLogout}
        >
          <span className="admin-nav-icon">🚪</span>
          <span>Выйти</span>
        </button>
      </div>
    </aside>
  );
}
