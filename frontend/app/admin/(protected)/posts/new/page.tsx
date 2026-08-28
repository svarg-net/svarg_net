"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PlateValue } from "@/lib/plate-types";
import {
  createPost,
  getCategories,
  getTags,
  createCategory,
  createTag,
  type Category,
  type Tag,
} from "@/lib/api";
import PlateEditor from "@/components/PlateEditor";

const initialValue: PlateValue = [
  {
    type: "p",
    children: [{ text: "" }],
  },
];

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState<PlateValue>(initialValue);
  const [status, setStatus] = useState("draft");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    loadCategoriesAndTags();
  }, []);

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

    try {
      const newCategory = await createCategory({ name: newCategoryName.trim() });
      setCategories([...categories, newCategory]);
      setSelectedCategory(newCategory.id);
      setNewCategoryName("");
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const newTag = await createTag({ name: newTagName.trim() });
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

    setError("");
    setLoading(true);

    try {
      await createPost({
        title,
        excerpt,
        content_json: content,
        status,
        category_id: selectedCategory > 0 ? selectedCategory : undefined,
        tag_ids: selectedTags.length > 0 ? selectedTags : undefined,
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
