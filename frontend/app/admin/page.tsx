"use client";

import Link from "next/link";

const ADMIN_LINKS = [
  {
    href: "/admin/posts",
    icon: "📝",
    title: "Посты",
    description: "Создание, редактирование и управление статьями",
  },
  {
    href: "/admin/categories",
    icon: "📁",
    title: "Категории",
    description: "Организация постов по разделам",
  },
  {
    href: "/admin/tags",
    icon: "🏷️",
    title: "Теги",
    description: "Ключевые слова для фильтрации контента",
  },
  {
    href: "/admin/media",
    icon: "🖼️",
    title: "Медиа",
    description: "Загрузка и управление файлами",
  },
  {
    href: "/admin/stats",
    icon: "📊",
    title: "Статистика",
    description: "Просмотры постов и аналитика",
  },
];

export default function AdminHomePage() {
  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "30px" }}>Панель управления</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {ADMIN_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              display: "block",
              padding: "24px",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              textDecoration: "none",
              color: "inherit",
              transition: "border-color 0.2s, box-shadow 0.2s",
              background: "#fff",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#0070f3";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,112,243,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e0e0e0";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>
              {link.icon}
            </div>
            <h2
              style={{
                margin: "0 0 8px 0",
                fontSize: "20px",
                fontWeight: 600,
              }}
            >
              {link.title}
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#666",
                lineHeight: 1.5,
              }}
            >
              {link.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
