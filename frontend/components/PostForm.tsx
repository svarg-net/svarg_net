"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PlateValue } from "@/lib/plate-types";
import {
  createPost,
  updatePost,
  getCategories,
  getTags,
  createCategory,
  createTag,
  type Post,
  type Category,
  type Tag,
} from "@/lib/api";
import PlateEditor from "@/components/PlateEditor";
import PlateRenderer from "@/components/PlateRenderer";
import AdminTabs, { useActiveTab } from "@/components/AdminTabs";
import SeoPreview from "@/components/SeoPreview";
import "@/styles/post-form.css";

const emptyContent: PlateValue = [{ type: "p", children: [{ text: "" }] }];

type Props = {
  mode: "create" | "edit";
  post?: Post;
};

export default function PostForm({ mode, post }: Props) {
  const router = useRouter();

  // Основное
  const [title, setTitle] = useState(post?.title || "");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [content, setContent] = useState<PlateValue>(
    (post?.content_json as PlateValue) || emptyContent
  );
  const [status, setStatus] = useState(post?.status || "draft");
  const [commentsEnabled, setCommentsEnabled] = useState<boolean>(
    post?.comments_enabled ?? true
  );

  // Категория/теги
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number>(
    post?.category_id || 0
  );
  const [selectedTags, setSelectedTags] = useState<number[]>(
    (post?.tags || []).map((t) => t.id)
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTagName, setNewTagName] = useState("");

  // SEO
  const [metaTitle, setMetaTitle] = useState(post?.meta_title || "");
  const [metaDescription, setMetaDescription] = useState(
    post?.meta_description || ""
  );
  const [metaKeywords, setMetaKeywords] = useState(
    (post?.meta_keywords || []).join(", ")
  );
  const [ogImage, setOgImage] = useState(post?.og_image || "");

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Вкладки
  const tabs = [
    {
      id: "content",
      label: "Контент",
      icon: "📝",
      hasIssue: !title.trim(),
    },
    { id: "publish", label: "Публикация", icon: "🚀" },
    { id: "seo", label: "SEO", icon: "🔍" },
    { id: "preview", label: "Предпросмотр", icon: "👁" },
  ];
  const activeTab = useActiveTab(tabs);

  const loadCategoriesAndTags = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadCategoriesAndTags();
  }, [loadCategoriesAndTags]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const newCategory = await createCategory({
        name: newCategoryName.trim(),
      });
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
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const save = async (finalStatus: string) => {
    if (!title.trim()) {
      setError("Заголовок обязателен");
      router.push("?tab=content");
      return;
    }

    setError("");
    setSaving(true);

    const payload = {
      title,
      excerpt,
      content_json: content,
      status: finalStatus,
      category_id: selectedCategory > 0 ? selectedCategory : undefined,
      tag_ids: selectedTags.length > 0 ? selectedTags : undefined,
      comments_enabled: commentsEnabled,
      meta_title: metaTitle || title,
      meta_description: metaDescription || excerpt,
      meta_keywords: metaKeywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0),
      og_image: ogImage,
    };

    try {
      if (mode === "create") {
        await createPost(payload);
      } else if (post) {
        await updatePost(post.id, payload);
      }
      router.push("/admin/posts");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {error && <div className="error-message">{error}</div>}

      <AdminTabs tabs={tabs} />

      <div className="post-tab-panel">
        {/* ===== Вкладка: Контент ===== */}
        {activeTab === "content" && (
          <div>
            <h2 className="post-tab-section-title">Содержимое поста</h2>

            <div className="form-group">
              <label htmlFor="title">
                Заголовок <span style={{ color: "#d33" }}>*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Как работать с горутинами в Go"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="excerpt">Анонс (excerpt)</label>
              <textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                placeholder="Короткое описание для списков постов и поисковой выдачи"
                style={{ minHeight: "80px", resize: "vertical" }}
              />
              <small style={{ color: "#888" }}>
                Показывается на главной и в RSS. 1–2 предложения.
              </small>
            </div>

            <div className="form-group">
              <label>Контент</label>
              <PlateEditor initialValue={content} onChange={setContent} />
            </div>
          </div>
        )}

        {/* ===== Вкладка: Публикация ===== */}
        {activeTab === "publish" && (
          <div>
            <h2 className="post-tab-section-title">Параметры публикации</h2>

            <div className="publish-grid">
              <div className="publish-section">
                <h3>Организация</h3>

                <div className="form-group">
                  <label htmlFor="category">Категория</label>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <select
                      id="category"
                      value={selectedCategory}
                      onChange={(e) =>
                        setSelectedCategory(Number(e.target.value))
                      }
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
                      placeholder="Новая"
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
                  <div className="tags-chips">
                    {tags.length === 0 && (
                      <span style={{ color: "#888", fontSize: "13px" }}>
                        Пока нет тегов
                      </span>
                    )}
                    {tags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={
                          "tag-chip" +
                          (selectedTags.includes(tag.id)
                            ? " tag-chip--selected"
                            : "")
                        }
                      >
                        #{tag.name}
                      </button>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
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
              </div>

              <div className="publish-section">
                <h3>Статус и настройки</h3>

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

                <div className="toggle-row">
                  <div>
                    <div className="toggle-row-label">Разрешить комментарии</div>
                    <div className="toggle-row-hint">
                      Читатели смогут оставлять комментарии
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={commentsEnabled}
                      onChange={(e) => setCommentsEnabled(e.target.checked)}
                    />
                    <span className="toggle-switch-slider" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Вкладка: SEO ===== */}
        {activeTab === "seo" && (
          <div>
            <h2 className="post-tab-section-title">
              SEO и мета-информация
            </h2>

            <div className="form-group">
              <label htmlFor="metaTitle">Meta Title</label>
              <input
                id="metaTitle"
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={title || "Заголовок для SEO"}
                maxLength={100}
              />
              <small style={{ color: "#888" }}>
                Оставьте пустым — возьмётся из заголовка поста
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
                maxLength={200}
              />
              <small style={{ color: "#888" }}>
                Оставьте пустым — возьмётся из анонса
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="metaKeywords">Ключевые слова (через запятую)</label>
              <input
                id="metaKeywords"
                type="text"
                value={metaKeywords}
                onChange={(e) => setMetaKeywords(e.target.value)}
                placeholder="Go, Golang, конкурентность"
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
              <small style={{ color: "#888" }}>
                Изображение для превью в соцсетях (1200×630)
              </small>
            </div>

            <SeoPreview
              title={title}
              metaTitle={metaTitle}
              metaDescription={metaDescription}
              excerpt={excerpt}
              url={
                mode === "edit" && post
                  ? `svarg.net/posts/${post.slug}`
                  : "svarg.net/posts/<slug>"
              }
            />
          </div>
        )}

        {/* ===== Вкладка: Предпросмотр ===== */}
        {activeTab === "preview" && (
          <div>
            <h2 className="post-tab-section-title">
              Как пост увидят читатели
            </h2>

            {!title.trim() ? (
              <div className="post-preview-empty">
                Заполните заголовок на вкладке «Контент»
              </div>
            ) : (
              <div className="post-preview-frame">
                <h1>{title}</h1>
                <div className="post-preview-meta">
                  <span>
                    📅 {new Date().toLocaleDateString("ru-RU", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  {selectedCategory > 0 && (
                    <span>
                      📁{" "}
                      {categories.find((c) => c.id === selectedCategory)?.name}
                    </span>
                  )}
                  <span>👁 0</span>
                </div>
                {excerpt && (
                  <div className="post-preview-excerpt">{excerpt}</div>
                )}
                <PlateRenderer content={content} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Футер с действиями */}
      <div className="post-form-footer">
        <div className="post-form-footer-left">
          <Link href="/admin/posts" className="btn btn-secondary">
            ← Отмена
          </Link>
        </div>
        <div className="post-form-footer-right">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => save("draft")}
            disabled={saving}
          >
            {saving ? "Сохранение..." : "Сохранить черновик"}
          </button>
          <button
            type="button"
            className="btn btn-publish"
            onClick={() => save("published")}
            disabled={saving}
          >
            {mode === "create" ? "Создать и опубликовать" : "Опубликовать"}
          </button>
        </div>
      </div>
    </>
  );
}
