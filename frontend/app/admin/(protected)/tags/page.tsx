"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getTags,
  createTag,
  deleteTag,
  type Tag,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import AdminNav from "@/components/AdminNav";

export default function AdminTagsPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Форма
  const [name, setName] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const response = await getTags();
      setTags(response.items || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setName("");
    setMetaTitle("");
    setMetaDescription("");
    setOgImage("");
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      await createTag({
        name,
        meta_title: metaTitle,
        meta_description: metaDescription,
        og_image: ogImage,
      });
      await loadTags();
      handleReset();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить этот тег?")) return;

    try {
      await deleteTag(id);
      await loadTags();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
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
        <h1>Управление тегами</h1>
        <div className="admin-nav">
          <Link href="/">На сайт</Link>
          <button onClick={handleLogout} className="btn btn-secondary">
            Выйти
          </button>
        </div>
      </div>

      <AdminNav />

      {error && <div className="error-message">{error}</div>}

      {!showForm && (
        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            + Новый тег
          </button>
        </div>
      )}

      {showForm && (
        <div style={{ marginBottom: "30px", padding: "20px", background: "#f9f9f9", borderRadius: "8px" }}>
          <h2>Новый тег</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Название</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="metaTitle">Meta Title</label>
              <input
                id="metaTitle"
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={name || "Заголовок для SEO"}
              />
            </div>

            <div className="form-group">
              <label htmlFor="metaDescription">Meta Description</label>
              <textarea
                id="metaDescription"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={2}
                placeholder={name || "Описание для SEO"}
              />
            </div>

            <div className="form-group">
              <label htmlFor="ogImage">OG Image URL</label>
              <input
                id="ogImage"
                type="url"
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
              <button type="button" onClick={handleReset} className="btn btn-secondary">
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {tags.length === 0 ? (
        <div className="empty-state">
          <p>Нет тегов</p>
        </div>
      ) : (
        <table className="posts-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Slug</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <tr key={tag.id}>
                <td>{tag.id}</td>
                <td>{tag.name}</td>
                <td>{tag.slug}</td>
                <td>
                  <div className="actions">
                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="btn btn-danger"
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
