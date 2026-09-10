"use client";

import { useEffect, useRef, useState } from "react";
import type { GalleryBlockData } from "@/lib/api/blocks";
import { resolveImageSrc } from "@/lib/api/blocks";

/**
 * Галерея с лайтбоксом: клик по картинке → полноэкранный просмотр.
 * Клавиши: Esc — закрыть, ←/→ — листать.
 */
export default function GalleryClient({ data }: { data: GalleryBlockData }) {
  const items = (data.items || []).filter((i) => resolveImageSrc(i));
  const layout = data.layout || "grid";
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Клавиатура в лайтбоксе
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight")
        setLightboxIndex((i) => (i === null ? i : Math.min(i + 1, items.length - 1)));
      if (e.key === "ArrowLeft")
        setLightboxIndex((i) => (i === null ? i : Math.max(i - 1, 0)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, items.length]);

  // Блокируем скролл страницы под лайтбоксом
  useEffect(() => {
    if (lightboxIndex === null) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxIndex]);

  const scrollBy = (dir: number) => {
    scrollerRef.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <>
      <div className={`block block-gallery block-gallery--${layout}`}>
        {layout === "slider" && items.length > 1 && (
          <>
            <button
              type="button"
              className="gallery-arrow gallery-arrow--left"
              onClick={() => scrollBy(-1)}
              aria-label="Предыдущая"
            >
              ‹
            </button>
            <button
              type="button"
              className="gallery-arrow gallery-arrow--right"
              onClick={() => scrollBy(1)}
              aria-label="Следующая"
            >
              ›
            </button>
          </>
        )}

        <div
          className={`block-gallery-track block-gallery-track--${layout}`}
          ref={layout === "slider" ? scrollerRef : undefined}
        >
          {items.map((item, i) => {
            const src = resolveImageSrc(item);
            return (
              <figure
                key={i}
                className="block-gallery-item"
                onClick={() => setLightboxIndex(i)}
              >
                <img src={src} alt={item.caption || ""} loading="lazy" />
                {item.caption && <figcaption>{item.caption}</figcaption>}
              </figure>
            );
          })}
        </div>
      </div>

      {lightboxIndex !== null && (
        <div className="lightbox" onClick={() => setLightboxIndex(null)}>
          <button
            type="button"
            className="lightbox-close"
            onClick={() => setLightboxIndex(null)}
            aria-label="Закрыть"
          >
            ✕
          </button>

          {lightboxIndex > 0 && (
            <button
              type="button"
              className="lightbox-arrow lightbox-arrow--left"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex - 1);
              }}
              aria-label="Предыдущая"
            >
              ‹
            </button>
          )}

          <figure
            className="lightbox-figure"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={resolveImageSrc(items[lightboxIndex])}
              alt={items[lightboxIndex].caption || ""}
            />
            {items[lightboxIndex].caption && (
              <figcaption>{items[lightboxIndex].caption}</figcaption>
            )}
          </figure>

          {lightboxIndex < items.length - 1 && (
            <button
              type="button"
              className="lightbox-arrow lightbox-arrow--right"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex + 1);
              }}
              aria-label="Следующая"
            >
              ›
            </button>
          )}

          <div className="lightbox-counter">
            {lightboxIndex + 1} / {items.length}
          </div>
        </div>
      )}
    </>
  );
}
