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