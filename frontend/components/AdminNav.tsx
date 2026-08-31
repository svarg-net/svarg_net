"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNav() {
  const pathname = usePathname();

  const links = [
    { href: "/admin/posts", label: "Посты" },
    { href: "/admin/categories", label: "Категории" },
    { href: "/admin/tags", label: "Теги" },
    { href: "/admin/media", label: "Медиа" },
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
    </nav>
  );
}
