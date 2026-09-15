"use client";

import Link from "next/link";
import "@/styles/admin/home.css";

const ADMIN_LINKS = [
  { href: "/admin/posts", icon: "📝", title: "Посты", description: "Создание, редактирование и управление статьями" },
  { href: "/admin/categories", icon: "📁", title: "Категории", description: "Организация постов по разделам" },
  { href: "/admin/tags", icon: "🏷️", title: "Теги", description: "Ключевые слова для фильтрации контента" },
  { href: "/admin/media", icon: "🖼️", title: "Медиа", description: "Загрузка и управление файлами" },
  { href: "/admin/comments", icon: "💬", title: "Комментарии", description: "Модерация комментариев" },
  { href: "/admin/polls", icon: "🗳", title: "Опросы", description: "Результаты голосований в блоках" },
  { href: "/admin/stats", icon: "📊", title: "Статистика", description: "Просмотры постов и аналитика" },
];

export default function AdminHomePage() {
  return (
    <div className="admin-home">
      <h1 className="admin-home-title">Панель управления</h1>
      <div className="admin-home-grid">
        {ADMIN_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="admin-home-card">
            <div className="admin-home-card-icon">{link.icon}</div>
            <h2 className="admin-home-card-title">{link.title}</h2>
            <p className="admin-home-card-desc">{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
