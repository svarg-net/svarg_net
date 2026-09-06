"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getPendingCount } from "@/lib/api/comments";

export default function AdminNav() {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      getPendingCount()
        .then((res) => {
          if (!cancelled) setPendingCount(res.count ?? 0);
        })
        .catch(() => {
          /* тихо */
        });
    };
    load();
    const interval = setInterval(load, 30000); // обновление каждые 30 сек
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pathname]);

  const links = [
    { href: "/admin/posts", label: "Посты" },
    { href: "/admin/categories", label: "Категории" },
    { href: "/admin/tags", label: "Теги" },
    { href: "/admin/media", label: "Медиа" },
    { href: "/admin/stats", label: "Статистика" },
  ];

  return (
    <nav className="admin-nav-menu">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={pathname === link.href ? "active" : ""}
        >
          {link.label}
        </Link>
      ))}
      <Link
        href="/admin/comments"
        className={pathname === "/admin/comments" ? "active" : ""}
        style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
      >
        Комментарии
        {pendingCount > 0 && (
          <span
            style={{
              background: "#e67e22",
              color: "#fff",
              borderRadius: "10px",
              padding: "2px 8px",
              fontSize: "12px",
              fontWeight: 600,
              minWidth: "20px",
              textAlign: "center",
            }}
          >
            {pendingCount}
          </span>
        )}
      </Link>
    </nav>
  );
}