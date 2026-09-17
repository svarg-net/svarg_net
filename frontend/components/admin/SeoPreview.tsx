"use client";

import "@/styles/post-form.css";

type Props = {
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  url: string;
  siteName?: string;
};

export default function SeoPreview({
  title,
  metaTitle,
  metaDescription,
  excerpt,
  url,
  siteName = "SVARG_NET",
}: Props) {
  const displayTitle = (metaTitle || title || "Без заголовка").slice(0, 70);
  const displayDesc = (metaDescription || excerpt || "")
    .slice(0, 160)
    .replace(/\n/g, " ");
  const displayUrl = url || "svarg.net/posts/...";

  return (
    <div className="seo-preview">
      <div className="seo-preview-label">Предпросмотр в Google</div>
      <div className="seo-preview-card">
        <div className="seo-preview-url">{displayUrl}</div>
        <div className="seo-preview-title">{displayTitle}</div>
        <div className="seo-preview-desc">
          {displayDesc || (
            <span className="seo-preview-empty">
              Добавьте meta_description или excerpt
            </span>
          )}
        </div>
        <div className="seo-preview-meta">
          {siteName} · Автор
        </div>
      </div>

      <div className="seo-preview-counters">
        <div
          className={
            "seo-counter" +
            ((metaTitle || title).length > 70 ? " seo-counter--warn" : "")
          }
        >
          Заголовок: {(metaTitle || title).length} / 70
        </div>
        <div
          className={
            "seo-counter" +
            ((metaDescription || excerpt).length > 160
              ? " seo-counter--warn"
              : "")
          }
        >
          Описание: {(metaDescription || excerpt).length} / 160
        </div>
      </div>

      <div className="seo-preview-hint">
        💡 Google показывает ~70 символов заголовка и ~160 описания. Ключевые
        слова лучше ставить ближе к началу.
      </div>
    </div>
  );
}
