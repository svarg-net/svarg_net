"use client";

import { usePostForm } from "./PostFormContext";

export default function PublishTab() {
  const { state, update, addCategory, addTag, toggleTag } = usePostForm();

  return (
    <div>
      <h2 className="post-tab-section-title">Параметры публикации</h2>

      <div className="publish-grid">
        <div className="publish-section">
          <h3>Организация</h3>

          <div className="form-group">
            <label htmlFor="category">Категория</label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <select
                id="category"
                value={state.selectedCategory}
                onChange={(e) =>
                  update({ selectedCategory: Number(e.target.value) })
                }
                style={{ flex: 1 }}
              >
                <option value={0}>Без категории</option>
                {state.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={state.newCategoryName}
                onChange={(e) => update({ newCategoryName: e.target.value })}
                placeholder="Новая"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={addCategory}
                className="btn btn-secondary"
              >
                +
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Теги</label>
            <div className="tags-chips">
              {state.tags.length === 0 && (
                <span style={{ color: "#888", fontSize: "13px" }}>
                  Пока нет тегов
                </span>
              )}
              {state.tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={
                    "tag-chip" +
                    (state.selectedTags.includes(tag.id)
                      ? " tag-chip--selected"
                      : "")
                  }
                >
                  #{tag.name}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                value={state.newTagName}
                onChange={(e) => update({ newTagName: e.target.value })}
                placeholder="Новый тег"
                style={{ flex: 1 }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={addTag}
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
              value={state.status}
              onChange={(e) => update({ status: e.target.value })}
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
                checked={state.commentsEnabled}
                onChange={(e) =>
                  update({ commentsEnabled: e.target.checked })
                }
              />
              <span className="toggle-switch-slider" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
