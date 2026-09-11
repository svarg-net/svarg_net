"use client";

import SeoPreview from "@/components/SeoPreview";
import { usePostForm } from "./PostFormContext";

export default function SeoTab() {
  const { mode, post, state, update } = usePostForm();

  return (
    <div>
      <h2 className="post-tab-section-title">SEO и мета-информация</h2>

      <div className="form-group">
        <label htmlFor="metaTitle">Meta Title</label>
        <input
          id="metaTitle"
          type="text"
          value={state.metaTitle}
          onChange={(e) => update({ metaTitle: e.target.value })}
          placeholder={state.title || "Заголовок для SEO"}
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
          value={state.metaDescription}
          onChange={(e) => update({ metaDescription: e.target.value })}
          rows={3}
          placeholder={state.excerpt || "Описание для SEO"}
          style={{ minHeight: "80px" }}
          maxLength={200}
        />
        <small style={{ color: "#888" }}>
          Оставьте пустым — возьмётся из анонса
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="metaKeywords">
          Ключевые слова (через запятую)
        </label>
        <input
          id="metaKeywords"
          type="text"
          value={state.metaKeywords}
          onChange={(e) => update({ metaKeywords: e.target.value })}
          placeholder="Go, Golang, конкурентность"
        />
      </div>

      <div className="form-group">
        <label htmlFor="ogImage">OG Image URL</label>
        <input
          id="ogImage"
          type="url"
          value={state.ogImage}
          onChange={(e) => update({ ogImage: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
        <small style={{ color: "#888" }}>
          Изображение для превью в соцсетях (1200×630)
        </small>
      </div>

      <SeoPreview
        title={state.title}
        metaTitle={state.metaTitle}
        metaDescription={state.metaDescription}
        excerpt={state.excerpt}
        url={
          mode === "edit" && post
            ? `svarg.net/posts/${post.slug}`
            : "svarg.net/posts/<slug>"
        }
      />
    </div>
  );
}
