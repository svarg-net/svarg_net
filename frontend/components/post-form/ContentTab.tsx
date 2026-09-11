"use client";

import PlateEditor from "@/components/PlateEditor";
import BlockEditor from "@/components/blocks/BlockEditor";
import { usePostForm } from "./PostFormContext";

export default function ContentTab() {
  const {
    mode,
    post,
    contentMode,
    saving,
    state,
    update,
    convertToBlocks,
  } = usePostForm();

  return (
    <div>
      <h2 className="post-tab-section-title">Содержимое поста</h2>

      <div className="form-group">
        <label htmlFor="title">
          Заголовок <span style={{ color: "#d33" }}>*</span>
        </label>
        <input
          id="title"
          type="text"
          value={state.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Например: Как работать с горутинами в Go"
          autoFocus
        />
      </div>

      <div className="form-group">
        <label htmlFor="excerpt">Анонс (excerpt)</label>
        <textarea
          id="excerpt"
          value={state.excerpt}
          onChange={(e) => update({ excerpt: e.target.value })}
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

        {mode === "edit" && contentMode === "blocks" && post ? (
          <BlockEditor postId={post.id} />
        ) : (
          <>
            <PlateEditor
              initialValue={state.content}
              onChange={(next) => update({ content: next })}
            />

            {mode === "edit" && post && (
              <div style={{ marginTop: "14px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={convertToBlocks}
                  disabled={saving}
                >
                  Конвертировать в блочный редактор
                </button>
                <p style={{ color: "#888", fontSize: "13px" }}>
                  После конвертации Plate-контент станет первым текстовым
                  блоком. Дальше пост можно собирать из блоков.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
