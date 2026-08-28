"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import AdminNav from "@/components/AdminNav";

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Форма
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.items || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || "");
    setMetaTitle(category.meta_title || "");
    setMetaDescription(category.meta_description || "");
    setOgImage(category.og_image || "");
    setShowForm(true);
  };

  const handleReset = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
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
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name,
          description,
          meta_title: metaTitle,
          meta_description: metaDescription,
          og_image: ogImage,
        });
      } else {
        await createCategory({
          name,
          description,
          meta_title: metaTitle,
          meta_description: metaDescription,
          og_image: ogImage,
        });
      }
      await loadCategories();
      handleReset();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить эту категорию?")) return;

    try {
      await deleteCategory(id);
      await loadCategories();
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
        <h1>Управление категориями</h1>
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
            + Новая категория
          </button>
        </div>
      )}

      {showForm && (
        <div style={{ marginBottom: "30px", padding: "20px", background: "#f9f9f9", borderRadius: "8px" }}>
          <h2>{editingCategory ? "Редактировать категорию" : "Новая категория"}</h2>
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
              <label htmlFor="description">Описание</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
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
                placeholder={description || "Описание для SEO"}
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

      {categories.length === 0 ? (
        <div className="empty-state">
          <p>Нет категорий</p>
        </div>
      ) : (
        <table className="posts-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Slug</th>
              <th>Описание</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.id}</td>
                <td>{category.name}</td>
                <td>{category.slug}</td>
                <td>{category.description || "—"}</td>
                <td>
                  <div className="actions">
                    <button
                      onClick={() => handleEdit(category)}
                      className="btn btn-secondary"
                    >
                      Изменить
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
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
