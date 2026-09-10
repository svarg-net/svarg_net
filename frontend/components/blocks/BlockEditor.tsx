"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PlateValue } from "@/lib/plate-types";
import PlateEditor from "@/components/PlateEditor";
import {
  createAdminBlock,
  deleteAdminBlock,
  getAdminBlocks,
  reorderAdminBlocks,
  updateAdminBlock,
} from "@/lib/api/blocks";
import type {
  Block,
  BlockType,
  CalloutBlockData,
  CodeBlockData,
  DividerBlockData,
  QuoteBlockData,
  TextBlockData,
  ImageBlockData,
  ImageTextBlockData,
  GalleryBlockData,
} from "@/lib/api/blocks";
import MediaPicker from "@/components/MediaPicker";
import type { MediaFile } from "@/lib/api";
import "@/styles/block-editor.css";

const emptyPlate: PlateValue = [
  {
    type: "p",
    children: [{ text: "" }],
  },
];

type Props = {
  postId: number;
};

const blockLabels: Record<string, string> = {
  text: "📝 Текст",
  image: "🖼️ Картинка",
  "image-text": "📰 Картинка + текст",
  code: "💻 Код",
  gallery: "📸 Галерея",
  quote: "📌 Цитата",
  callout: "📢 Callout",
  divider: "➗ Разделитель",
};

const addableBlocks: Array<{
  type: BlockType;
  label: string;
  defaultData: Record<string, unknown>;
}> = [
  {
    type: "text",
    label: "Текст",
    defaultData: { content_json: emptyPlate },
  },
  {
    type: "code",
    label: "Код",
    defaultData: {
      language: "go",
      filename: "",
      code: "package main\n\nfunc main() {\n\n}",
    },
  },
  {
    type: "callout",
    label: "Callout",
    defaultData: {
      type: "info",
      title: "Важно",
      text: "Текст заметки",
    },
  },
  {
    type: "quote",
    label: "Цитата",
    defaultData: {
      text: "Текст цитаты",
      author: "",
      source: "",
    },
  },
  {
    type: "divider",
    label: "Разделитель",
    defaultData: {
      style: "line",
    },
  },
    {
    type: "image",
    label: "Картинка",
    defaultData: {
      media_id: undefined,
      caption: "",
      align: "center",
    },
  },
  {
    type: "image-text",
    label: "Картинка + текст",
    defaultData: {
      media_id: undefined,
      caption: "",
      layout: "left",
      content_json: emptyPlate,
    },
  },
  {
    type: "gallery",
    label: "Галерея",
    defaultData: {
      items: [],
      layout: "grid",
    },
  },
];

export default function BlockEditor({ postId }: Props) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const items = await getAdminBlocks(postId);
      setBlocks(items);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  const blockIds = useMemo(() => blocks.map((b) => b.id), [blocks]);

  const handleAdd = async (type: BlockType) => {
    const config = addableBlocks.find((b) => b.type === type);
    if (!config) return;

    setBusy(true);
    try {
      const created = await createAdminBlock(postId, {
        type,
        data: config.defaultData,
      });
      setBlocks((prev) => [...prev, created]);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить блок?")) return;

    setBusy(true);
    try {
      await deleteAdminBlock(id);
      setBlocks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDuplicate = async (block: Block) => {
    setBusy(true);
    try {
      const created = await createAdminBlock(postId, {
        type: block.type as BlockType,
        data: block.data,
        position: block.position + 1,
      });
      setBlocks((prev) => {
        const idx = prev.findIndex((b) => b.id === block.id);
        const next = [...prev];
        next.splice(idx + 1, 0, created);
        return next;
      });
      await load();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateLocal = (id: number, data: Record<string, unknown>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, data } : b))
    );
  };

  const handleSave = async (block: Block) => {
    setBusy(true);
    try {
      const updated = await updateAdminBlock(block.id, {
        data: block.data,
      });
      setBlocks((prev) =>
        prev.map((b) => (b.id === block.id ? updated : b))
      );
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(blocks, oldIndex, newIndex);
    setBlocks(next);

    try {
      await reorderAdminBlocks(
        postId,
        next.map((b) => b.id)
      );
      await load();
    } catch (err) {
      alert((err as Error).message);
      load();
    }
  };

  if (loading) {
    return <p>Загрузка блоков...</p>;
  }

  return (
    <div className="block-editor">
      {error && <div className="error-message">{error}</div>}

      <div className="block-editor-toolbar">
        <div>
          <div className="block-editor-toolbar-title">
            Блочный редактор
          </div>
          <div className="block-editor-toolbar-hint">
            Перетаскивай блоки за ручку. Каждый блок сохраняется отдельно.
          </div>
        </div>

        <div className="block-add-row">
          {addableBlocks.map((b) => (
            <button
              key={b.type}
              type="button"
              disabled={busy}
              onClick={() => handleAdd(b.type)}
            >
              + {b.label}
            </button>
          ))}
        </div>
      </div>

      {blocks.length === 0 ? (
        <div className="block-editor-empty">
          Блоков пока нет. Добавь первый блок сверху.
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext
            items={blockIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="block-editor-list">
              {blocks.map((block) => (
                <SortableBlockItem
                  key={block.id}
                  block={block}
                  busy={busy}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onUpdateLocal={handleUpdateLocal}
                  onSave={handleSave}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

type SortableBlockItemProps = {
  block: Block;
  busy: boolean;
  onDelete: (id: number) => void;
  onDuplicate: (block: Block) => void;
  onUpdateLocal: (id: number, data: Record<string, unknown>) => void;
  onSave: (block: Block) => void;
};

function SortableBlockItem({
  block,
  busy,
  onDelete,
  onDuplicate,
  onUpdateLocal,
  onSave,
}: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        "block-editor-item" +
        (isDragging ? " block-editor-item--dragging" : "")
      }
    >
      <div className="block-editor-item-head">
        <div className="block-editor-item-title">
          <button
            type="button"
            className="block-drag-handle"
            {...attributes}
            {...listeners}
            title="Перетащить"
          >
            ⋮⋮
          </button>
          <span>{blockLabels[block.type] || block.type}</span>
          <span className="block-editor-badge">#{block.id}</span>
        </div>

        <div className="block-editor-item-actions">
          <button
            type="button"
            disabled={busy}
            onClick={() => onDuplicate(block)}
          >
            Дублировать
          </button>
          <button
            type="button"
            disabled={busy}
            className="danger"
            onClick={() => onDelete(block.id)}
          >
            Удалить
          </button>
        </div>
      </div>

      <div className="block-editor-item-body">
        <BlockFields
          block={block}
          onChange={(data) => onUpdateLocal(block.id, data)}
        />

        <div className="block-editor-save-row">
          <button type="button" disabled={busy} onClick={() => onSave(block)}>
            Сохранить блок
          </button>
        </div>
      </div>
    </div>
  );
}

function BlockFields({
  block,
  onChange,
}: {
  block: Block;
  onChange: (data: Record<string, unknown>) => void;
}) {
  switch (block.type) {
    case "text":
      return (
        <TextBlockFields
          data={block.data as TextBlockData}
          onChange={onChange}
        />
      );
    case "code":
      return (
        <CodeBlockFields
          data={block.data as CodeBlockData}
          onChange={onChange}
        />
      );
    case "callout":
      return (
        <CalloutBlockFields
          data={block.data as CalloutBlockData}
          onChange={onChange}
        />
      );
    case "quote":
      return (
        <QuoteBlockFields
          data={block.data as QuoteBlockData}
          onChange={onChange}
        />
      );
    case "divider":
      return (
        <DividerBlockFields
          data={block.data as DividerBlockData}
          onChange={onChange}
        />
      );
    case "image":
      return (
        <ImageBlockFields
          data={block.data as ImageBlockData}
          onChange={onChange}
        />
      );
    case "image-text":
      return (
        <ImageTextBlockFields
          data={block.data as ImageTextBlockData}
          onChange={onChange}
        />
      );
    case "gallery":
      return (
        <GalleryBlockFields
          data={block.data as GalleryBlockData}
          onChange={onChange}
        />
      );
    default:
      return (
        <div style={{ color: "#888" }}>
          Редактор для блока <code>{block.type}</code> ещё не реализован.
        </div>
      );
  }
}

function TextBlockFields({
  data,
  onChange,
}: {
  data: TextBlockData;
  onChange: (data: Record<string, unknown>) => void;
}) {
  const value = data.content_json || emptyPlate;

  return (
    <div className="block-editor-field">
      <label>Текст</label>
      <PlateEditor
        initialValue={value}
        onChange={(next) => onChange({ ...data, content_json: next })}
      />
    </div>
  );
}

function CodeBlockFields({
  data,
  onChange,
}: {
  data: CodeBlockData;
  onChange: (data: Record<string, unknown>) => void;
}) {
  return (
    <>
      <div className="block-editor-two-cols">
        <div className="block-editor-field">
          <label>Язык</label>
          <input
            value={data.language || ""}
            onChange={(e) => onChange({ ...data, language: e.target.value })}
            placeholder="go, ts, bash..."
          />
        </div>
        <div className="block-editor-field">
          <label>Имя файла</label>
          <input
            value={data.filename || ""}
            onChange={(e) => onChange({ ...data, filename: e.target.value })}
            placeholder="main.go"
          />
        </div>
      </div>

      <div className="block-editor-field">
        <label>Код</label>
        <textarea
          className="code"
          value={data.code || ""}
          onChange={(e) => onChange({ ...data, code: e.target.value })}
        />
      </div>
    </>
  );
}

function CalloutBlockFields({
  data,
  onChange,
}: {
  data: CalloutBlockData;
  onChange: (data: Record<string, unknown>) => void;
}) {
  return (
    <>
      <div className="block-editor-two-cols">
        <div className="block-editor-field">
          <label>Тип</label>
          <select
            value={data.type || "info"}
            onChange={(e) => onChange({ ...data, type: e.target.value })}
          >
            <option value="info">info</option>
            <option value="success">success</option>
            <option value="warning">warning</option>
            <option value="error">error</option>
          </select>
        </div>

        <div className="block-editor-field">
          <label>Заголовок</label>
          <input
            value={data.title || ""}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
          />
        </div>
      </div>

      <div className="block-editor-field">
        <label>Текст</label>
        <textarea
          value={data.text || ""}
          onChange={(e) => onChange({ ...data, text: e.target.value })}
        />
      </div>
    </>
  );
}

function QuoteBlockFields({
  data,
  onChange,
}: {
  data: QuoteBlockData;
  onChange: (data: Record<string, unknown>) => void;
}) {
  return (
    <>
      <div className="block-editor-field">
        <label>Цитата</label>
        <textarea
          value={data.text || ""}
          onChange={(e) => onChange({ ...data, text: e.target.value })}
        />
      </div>

      <div className="block-editor-two-cols">
        <div className="block-editor-field">
          <label>Автор</label>
          <input
            value={data.author || ""}
            onChange={(e) => onChange({ ...data, author: e.target.value })}
          />
        </div>

        <div className="block-editor-field">
          <label>Источник</label>
          <input
            value={data.source || ""}
            onChange={(e) => onChange({ ...data, source: e.target.value })}
          />
        </div>
      </div>
    </>
  );
}

function DividerBlockFields({
  data,
  onChange,
}: {
  data: DividerBlockData;
  onChange: (data: Record<string, unknown>) => void;
}) {
  return (
    <div className="block-editor-field">
      <label>Стиль</label>
      <select
        value={data.style || "line"}
        onChange={(e) => onChange({ ...data, style: e.target.value })}
      >
        <option value="line">Линия</option>
        <option value="dots">Точки</option>
        <option value="space">Пустой отступ</option>
      </select>
    </div>
  );
}
function ImageBlockFields({
  data,
  onChange,
}: {
  data: ImageBlockData;
  onChange: (data: Record<string, unknown>) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  const handleSelect = (media: MediaFile) => {
    onChange({ ...data, media_id: media.id, url: "" });
  };

  const previewUrl = data.media_id
  ? `/api/v1/media/${data.media_id}/file`
  : data.url || "";

  return (
    <>
      <div className="block-editor-field">
        <label>Картинка</label>
        {previewUrl && (
          <div style={{ marginBottom: "12px" }}>
            <img
              src={previewUrl}
              alt=""
              style={{
                maxWidth: "100%",
                maxHeight: "300px",
                borderRadius: "8px",
              }}
            />
          </div>
        )}
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setShowPicker(true)}
        >
          {data.media_id ? "Изменить картинку" : "Выбрать картинку"}
        </button>
      </div>

      <div className="block-editor-two-cols">
        <div className="block-editor-field">
          <label>Подпись</label>
          <input
            value={data.caption || ""}
            onChange={(e) => onChange({ ...data, caption: e.target.value })}
            placeholder="Описание картинки"
          />
        </div>

        <div className="block-editor-field">
          <label>Выравнивание</label>
          <select
            value={data.align || "center"}
            onChange={(e) => onChange({ ...data, align: e.target.value })}
          >
            <option value="left">Слева</option>
            <option value="center">По центру</option>
            <option value="right">Справа</option>
          </select>
        </div>
      </div>

      {showPicker && (
        <MediaPicker
          isOpen={true}
          onSelect={handleSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}

function ImageTextBlockFields({
  data,
  onChange,
}: {
  data: ImageTextBlockData;
  onChange: (data: Record<string, unknown>) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  const handleSelect = (media: MediaFile) => {
    onChange({ ...data, media_id: media.id, url: "" });
  };

  const previewUrl = data.media_id
  ? `/api/v1/media/${data.media_id}/file`
  : data.url || "";

  return (
    <>
      <div className="block-editor-two-cols">
        <div className="block-editor-field">
          <label>Картинка</label>
          {previewUrl && (
            <div style={{ marginBottom: "12px" }}>
              <img
                src={previewUrl}
                alt=""
                style={{
                  width: "100%",
                  maxHeight: "200px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            </div>
          )}
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowPicker(true)}
          >
            {data.media_id ? "Изменить" : "Выбрать"}
          </button>
        </div>

        <div className="block-editor-field">
          <label>Расположение картинки</label>
          <select
            value={data.layout || "left"}
            onChange={(e) => onChange({ ...data, layout: e.target.value })}
          >
            <option value="left">Слева</option>
            <option value="right">Справа</option>
          </select>

          <label style={{ marginTop: "14px" }}>Подпись</label>
          <input
            value={data.caption || ""}
            onChange={(e) => onChange({ ...data, caption: e.target.value })}
            placeholder="Описание картинки"
          />
        </div>
      </div>

      <div className="block-editor-field">
        <label>Текст</label>
        <PlateEditor
          initialValue={data.content_json || emptyPlate}
          onChange={(next) => onChange({ ...data, content_json: next })}
        />
      </div>

      {showPicker && (
        <MediaPicker
          isOpen={true}
          onSelect={handleSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}

function GalleryBlockFields({
  data,
  onChange,
}: {
  data: GalleryBlockData;
  onChange: (data: Record<string, unknown>) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const items = data.items || [];

  const handleSelect = (media: MediaFile) => {
    const newItem = {
      media_id: media.id,
      url: "",
      caption: "",
    };
    onChange({ ...data, items: [...items, newItem] });
  };

  const handleRemove = (index: number) => {
    onChange({
      ...data,
      items: items.filter((_, i) => i !== index),
    });
  };

  const handleCaptionChange = (index: number, caption: string) => {
    onChange({
      ...data,
      items: items.map((item, i) => (i === index ? { ...item, caption } : item)),
    });
  };

  return (
    <>
      <div className="block-editor-field">
        <label>Layout</label>
        <select
          value={data.layout || "grid"}
          onChange={(e) => onChange({ ...data, layout: e.target.value })}
        >
          <option value="grid">Сетка</option>
          <option value="slider">Слайдер</option>
          <option value="masonry">Masonry</option>
        </select>
      </div>

      <div className="block-editor-field">
        <label>Картинки ({items.length})</label>
        {items.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            {items.map((item, i) => {
              const src = item.media_id
                ? `/api/v1/media/${item.media_id}/file`
                : item.url || "";
              return (
                <div
                  key={i}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={src}
                    alt=""
                    style={{
                      width: "100%",
                      height: "120px",
                      objectFit: "cover",
                    }}
                  />
                  <div style={{ padding: "8px" }}>
                    <input
                      type="text"
                      value={item.caption || ""}
                      onChange={(e) =>
                        handleCaptionChange(i, e.target.value)
                      }
                      placeholder="Подпись"
                      style={{
                        width: "100%",
                        fontSize: "12px",
                        padding: "4px 6px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        marginBottom: "6px",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemove(i)}
                      style={{
                        width: "100%",
                        padding: "4px",
                        background: "#c33",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setShowPicker(true)}
        >
          + Добавить картинку
        </button>
      </div>

      {showPicker && (
        <MediaPicker
          isOpen={true}
          onSelect={handleSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}