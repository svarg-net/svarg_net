"use client";

import { useCallback, useEffect, useState } from "react";
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
} from "@/lib/api";
import { convertPostToBlocks } from "@/lib/api/blocks";
import AdminTabs, { useActiveTab } from "@/components/AdminTabs";
import {
  PostFormContext,
  type PostFormContextValue,
  type PostFormState,
} from "@/components/post-form/PostFormContext";
import ContentTab from "@/components/post-form/ContentTab";
import PublishTab from "@/components/post-form/PublishTab";
import SeoTab from "@/components/post-form/SeoTab";
import PreviewTab from "@/components/post-form/PreviewTab";
import "@/styles/post-form.css";

const emptyContent: PlateValue = [
  { type: "p", children: [{ text: "" }] },
];

type Props = {
  mode: "create" | "edit";
  post?: Post;
};

export default function PostForm({ mode, post }: Props) {
  const router = useRouter();

  const [state, setState] = useState<PostFormState>({
    title: post?.title || "",
    excerpt: post?.excerpt || "",
    content: (post?.content_json as PlateValue) || emptyContent,
    status: post?.status || "draft",
    commentsEnabled: post?.comments_enabled ?? true,
    categories: [],
    tags: [],
    selectedCategory: post?.category_id || 0,
    selectedTags: (post?.tags || []).map((t) => t.id),
    newCategoryName: "",
    newTagName: "",
    metaTitle: post?.meta_title || "",
    metaDescription: post?.meta_description || "",
    metaKeywords: (post?.meta_keywords || []).join(", "),
    ogImage: post?.og_image || "",
  });
  const [contentMode, setContentMode] = useState(
    post?.content_mode || "plate"
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = useCallback((patch: Partial<PostFormState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getCategories(), getTags()])
      .then(([catRes, tagRes]) => {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          categories: catRes.items || [],
          tags: tagRes.items || [],
        }));
      })
      .catch((err) => console.error("Failed to load categories/tags:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  const addCategory = useCallback(async () => {
    const name = state.newCategoryName.trim();
    if (!name) return;
    try {
      const created = await createCategory({ name });
      setState((prev) => ({
        ...prev,
        categories: [...prev.categories, created],
        selectedCategory: created.id,
        newCategoryName: "",
      }));
    } catch (err) {
      alert((err as Error).message);
    }
  }, [state.newCategoryName]);

  const addTag = useCallback(async () => {
    const name = state.newTagName.trim();
    if (!name) return;
    try {
      const created = await createTag({ name });
      setState((prev) => ({
        ...prev,
        tags: [...prev.tags, created],
        selectedTags: [...prev.selectedTags, created.id],
        newTagName: "",
      }));
    } catch (err) {
      alert((err as Error).message);
    }
  }, [state.newTagName]);

  const toggleTag = useCallback((tagId: number) => {
    setState((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagId)
        ? prev.selectedTags.filter((id) => id !== tagId)
        : [...prev.selectedTags, tagId],
    }));
  }, []);

  const convertToBlocks = useCallback(async () => {
    if (!post) return;
    if (
      !confirm(
        "Конвертировать пост в блочный режим? Старый Plate-контент станет первым text-блоком."
      )
    ) {
      return;
    }
    setSaving(true);
    setError("");
    try {
      await convertPostToBlocks(post.id);
      setContentMode("blocks");
      alert("Пост конвертирован в блочный режим");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }, [post]);

  const save = async (finalStatus: string) => {
    if (!state.title.trim()) {
      setError("Заголовок обязателен");
      router.push("?tab=content");
      return;
    }

    setError("");
    setSaving(true);

    const payload = {
      title: state.title,
      excerpt: state.excerpt,
      content_json: contentMode === "blocks" ? undefined : state.content,
      status: finalStatus,
      category_id:
        state.selectedCategory > 0 ? state.selectedCategory : undefined,
      tag_ids: state.selectedTags.length > 0 ? state.selectedTags : undefined,
      comments_enabled: state.commentsEnabled,
      meta_title: state.metaTitle || state.title,
      meta_description: state.metaDescription || state.excerpt,
      meta_keywords: state.metaKeywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0),
      og_image: state.ogImage,
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

  const tabs = [
    {
      id: "content",
      label: "Контент",
      icon: "📝",
      hasIssue: !state.title.trim(),
    },
    { id: "publish", label: "Публикация", icon: "🚀" },
    { id: "seo", label: "SEO", icon: "🔍" },
    { id: "preview", label: "Предпросмотр", icon: "👁" },
  ];
  const activeTab = useActiveTab(tabs);

  const ctxValue: PostFormContextValue = {
    mode,
    post,
    contentMode,
    saving,
    state,
    update,
    addCategory,
    addTag,
    toggleTag,
    convertToBlocks,
  };

  return (
    <PostFormContext.Provider value={ctxValue}>
      {error && <div className="error-message">{error}</div>}

      <AdminTabs tabs={tabs} />

      <div className="post-tab-panel">
        {activeTab === "content" && <ContentTab />}
        {activeTab === "publish" && <PublishTab />}
        {activeTab === "seo" && <SeoTab />}
        {activeTab === "preview" && <PreviewTab />}
      </div>

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
    </PostFormContext.Provider>
  );
}
