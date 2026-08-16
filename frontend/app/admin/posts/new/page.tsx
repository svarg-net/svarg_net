"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Value } from "platejs";
import { createPost } from "@/lib/api";
import { getToken, isAuthenticated } from "@/lib/auth";
import PlateEditor from "@/components/PlateEditor";

const initialValue: Value = [
  {
    type: "p",
    children: [{ text: "" }],
  },
];

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState<Value>(initialValue);
  const [status, setStatus] = useState("draft");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Мета-информация
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [ogImage, setOgImage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated()) {
      router.push("/admin/login");
      return;
    }

    const token = getToken();
    if (!token) {
      router.push("/admin/login");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await createPost(token, {
        title,
        excerpt,
        content_json: content,
        status,
        meta_title: metaTitle || title,
        meta_description: metaDescription || excerpt,
        meta_keywords: metaKeywords
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k.length > 0),
        og_image: ogImage,
      });
      router.push("/admin/posts");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Новый пост</h1>
        <div className="admin-nav">
          <Link href="/admin/posts">Назад к списку</Link>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Заголовок</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Введите заголовок поста"
          />
        </div>

        <div className="form-group">
          <label htmlFor="excerpt">Краткое описание (excerpt)</label>
          <input
            id="excerpt"
            type="text"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Краткое описание для списка постов"
          />
        </div>

        <div className="form-group">
          <label>Контент</label>
          <PlateEditor
            initialValue={content}
            onChange={setContent}
          />
        </div>

        <div className="form-group">
          <label htmlFor="status">Статус</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="draft">Черновик</option>
            <option value="published">Опубликован</option>
            <option value="archived">Архив</option>
          </select>
        </div>

        {/* Секция мета-информации */}
        <fieldset style={{ marginTop: "30px", padding: "20px", border: "1px solid #ddd", borderRadius: "8px" }}>
          <legend style={{ fontWeight: "bold", padding: "0 10px" }}>SEO / Мета-информация</legend>

          <div className="form-group">
            <label htmlFor="metaTitle">Meta Title (заголовок для поисковиков)</label>
            <input
              id="metaTitle"
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder={title || "Заголовок для SEO (оставьте пустым чтобы использовать основной)"}
            />
            <small style={{ color: "#666" }}>
              {metaTitle.length}/60 символов. Если пусто, будет использован основной заголовок.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="metaDescription">Meta Description (описание для поисковиков)</label>
            <textarea
              id="metaDescription"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={3}
              placeholder={excerpt || "Описание для SEO (оставьте пустым чтобы использовать excerpt)"}
              style={{ minHeight: "80px" }}
            />
            <small style={{ color: "#666" }}>
              {metaDescription.length}/160 символов. Если пусто, будет использован excerpt.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="metaKeywords">Meta Keywords (ключевые слова через запятую)</label>
            <input
              id="metaKeywords"
              type="text"
              value={metaKeywords}
              onChange={(e) => setMetaKeywords(e.target.value)}
              placeholder="Go, Golang, Next.js, PostgreSQL"
            />
          </div>

          <div className="form-group">
            <label htmlFor="ogImage">OG Image URL (изображение для соцсетей)</label>
            <input
              id="ogImage"
              type="url"
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            <small style={{ color: "#666" }}>
              Рекомендуемый размер: 1200x630px. Если пусто, будет использовано изображение по умолчанию.
            </small>
          </div>
        </fieldset>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? "Создание..." : "Создать пост"}
          </button>
          <Link href="/admin/posts" className="btn btn-secondary">
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}