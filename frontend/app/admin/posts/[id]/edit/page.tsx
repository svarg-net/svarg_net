"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import type { Value } from "platejs";
import { getPosts, updatePost, type Post } from "@/lib/api";
import { getToken, isAuthenticated } from "@/lib/auth";
import PlateEditor from "@/components/PlateEditor";

const emptyContent: Value = [
  {
    type: "p",
    children: [{ text: "" }],
  },
];

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = Number(params.id);

  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState<Value>(emptyContent);
  const [status, setStatus] = useState("draft");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Мета-информация
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [ogImage, setOgImage] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/admin/login");
      return;
    }

    loadPost();
  }, [postId, router]);

  const loadPost = async () => {
    try {
      const response = await getPosts("", 1, 100);
      const found = response.items.find((p) => p.id === postId);

      if (!found) {
        router.push("/admin/posts");
        return;
      }

      setPost(found);
      setTitle(found.title);
      setExcerpt(found.excerpt || "");
      setContent((found.content_json as Value) || emptyContent);
      setStatus(found.status);
      setMetaTitle(found.meta_title || "");
      setMetaDescription(found.meta_description || "");
      setMetaKeywords((found.meta_keywords || []).join(", "));
      setOgImage(found.og_image || "");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = getToken();
    if (!token) {
      router.push("/admin/login");
      return;
    }

    setError("");
    setSaving(true);

    try {
      await updatePost(token, postId, {
        title,
        excerpt,
        content_json: content,
        status,
        meta_title: metaTitle,
        meta_description: metaDescription,
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
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Редактирование поста</h1>
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
          />
        </div>

        <div className="form-group">
          <label htmlFor="excerpt">Краткое описание (excerpt)</label>
          <input
            id="excerpt"
            type="text"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
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
            <label htmlFor="metaTitle">Meta Title</label>
            <input
              id="metaTitle"
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder={title || "Заголовок для SEO"}
            />
            <small style={{ color: "#666" }}>
              {metaTitle.length}/60 символов
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="metaDescription">Meta Description</label>
            <textarea
              id="metaDescription"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={3}
              placeholder={excerpt || "Описание для SEO"}
              style={{ minHeight: "80px" }}
            />
            <small style={{ color: "#666" }}>
              {metaDescription.length}/160 символов
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="metaKeywords">Meta Keywords (через запятую)</label>
            <input
              id="metaKeywords"
              type="text"
              value={metaKeywords}
              onChange={(e) => setMetaKeywords(e.target.value)}
              placeholder="Go, Golang, Next.js"
            />
          </div>

          <div className="form-group">
            <label htmlFor="ogImage">OG Image URL</label>
            <input
              id="ogImage"
              type="url"
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </fieldset>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
          <Link href="/admin/posts" className="btn btn-secondary">
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}