"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import type { PlateValue } from "@/lib/plate-types";
import {
  getPosts,
  updatePost,
  createCategory,
  createTag,
  getCategories,
  getTags,
  type Post,
  type Category,
  type Tag,
} from "@/lib/api";
import { getToken, isAuthenticated } from "@/lib/auth";
import PlateEditor from "@/components/PlateEditor";

const emptyContent: PlateValue = [
  {
    type: "p",
    children: [{ text: "" }],
  },
];

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = Number(params.id);

  const [, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState<PlateValue>(emptyContent);
  const [status, setStatus] = useState("draft");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Категория и теги
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTagName, setNewTagName] = useState("");

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
  loadCategoriesAndTags();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setContent((found.content_json as PlateValue) || emptyContent);
      setStatus(found.status);
      setSelectedCategory(found.category_id || 0);
      setSelectedTags((found.tags || []).map((t) => t.id));
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

    const loadCategoriesAndTags = async () => {
    try {
      const [catResponse, tagResponse] = await Promise.all([
        getCategories(),
        getTags(),
      ]);
      setCategories(catResponse.items || []);
      setTags(tagResponse.items || []);
    } catch (err) {
      console.error("Failed to load categories/tags:", err);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    const token = getToken();
    if (!token) return;

    try {
      const newCategory = await createCategory(token, { name: newCategoryName.trim() });
      setCategories([...categories, newCategory]);
      setSelectedCategory(newCategory.id);
      setNewCategoryName("");
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;

    const token = getToken();
    if (!token) return;

    try {
      const newTag = await createTag(token, { name: newTagName.trim() });
      setTags([...tags, newTag]);
      setSelectedTags([...selectedTags, newTag.id]);
      setNewTagName("");
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const toggleTag = (tagId: number) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter((id) => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
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
        category_id: selectedCategory > 0 ? selectedCategory : undefined,
        tag_ids: selectedTags,
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

        {/* Категория и теги */}
        <fieldset style={{ marginTop: "30px", padding: "20px", border: "1px solid #ddd", borderRadius: "8px" }}>
          <legend style={{ fontWeight: "bold", padding: "0 10px" }}>Категория и теги</legend>

          <div className="form-group">
            <label htmlFor="category">Категория</label>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(Number(e.target.value))}
                style={{ flex: 1 }}
              >
                <option value={0}>Без категории</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Новая категория"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="btn btn-secondary"
              >
                +
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Теги</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  style={{
                    padding: "5px 12px",
                    border: selectedTags.includes(tag.id) ? "2px solid #0066cc" : "1px solid #ddd",
                    borderRadius: "16px",
                    background: selectedTags.includes(tag.id) ? "#e6f0ff" : "white",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Новый тег"
                style={{ flex: 1 }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="btn btn-secondary"
              >
                +
              </button>
            </div>
          </div>
        </fieldset>

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