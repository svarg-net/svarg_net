"use client";

import PlateRenderer from "@/components/PlateRenderer";
import { usePostForm } from "./PostFormContext";

export default function PreviewTab() {
  const { state } = usePostForm();

  return (
    <div>
      <h2 className="post-tab-section-title">
        Как пост увидят читатели
      </h2>

      {!state.title.trim() ? (
        <div className="post-preview-empty">
          Заполните заголовок на вкладке «Контент»
        </div>
      ) : (
        <div className="post-preview-frame">
          <h1>{state.title}</h1>
          <div className="post-preview-meta">
            <span>
              📅{" "}
              {new Date().toLocaleDateString("ru-RU", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
            {state.selectedCategory > 0 && (
              <span>
                📁{" "}
                {
                  state.categories.find(
                    (c) => c.id === state.selectedCategory
                  )?.name
                }
              </span>
            )}
            <span>👁 0</span>
          </div>
          {state.excerpt && (
            <div className="post-preview-excerpt">{state.excerpt}</div>
          )}
          <PlateRenderer content={state.content} />
        </div>
      )}
    </div>
  );
}
