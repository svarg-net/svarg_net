"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  createAdminBlock,
  deleteAdminBlock,
  getAdminBlocks,
  reorderAdminBlocks,
  updateAdminBlock,
  type Block,
  type BlockType,
} from "@/lib/api/blocks";
import SortableBlockItem from "./editor/SortableBlockItem";
import DropZone from "./editor/DropZone";
import PaletteItem from "./editor/PaletteItem";
import { addableBlocks, blockLabels } from "./editor/constants";
import "@/styles/admin/block-editor/editor.css";
import "@/styles/admin/block-editor/palette.css";

type Props = {
  postId: number;
};

export default function BlockEditor({ postId }: Props) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [dragLabel, setDragLabel] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      setBlocks(await getAdminBlocks(postId));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  const blockIds = useMemo(() => blocks.map((b) => b.id), [blocks]);

  const toggleInsertAt = (index: number) =>
    setInsertAt((prev) => (prev === index ? null : index));

  const handleAdd = async (type: BlockType, at: number | null) => {
    const config = addableBlocks.find((b) => b.type === type);
    if (!config) return;

    setBusy(true);
    try {
      const created = await createAdminBlock(postId, {
        type,
        data: config.defaultData,
      });

      if (at !== null && at < blocks.length) {
        const next = [...blocks];
        next.splice(at, 0, created);
        await reorderAdminBlocks(
          postId,
          next.map((b) => b.id)
        );
      } else {
        setBlocks((prev) => [...prev, created]);
      }

      setInsertAt(null);
      await load(true);
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
      setInsertAt(null);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDuplicate = async (block: Block) => {
    setBusy(true);
    try {
      await createAdminBlock(postId, {
        type: block.type as BlockType,
        data: block.data,
        position: block.position + 1,
      });
      await load(true);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateLocal = (id: number, data: Record<string, unknown>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, data } : b)));
  };

  const handleSave = async (block: Block) => {
    setBusy(true);
    try {
      const updated = await updateAdminBlock(block.id, { data: block.data });
      setBlocks((prev) => prev.map((b) => (b.id === block.id ? updated : b)));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    if (id.startsWith("new:")) {
      setDragLabel(id.slice(4));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDragLabel(null);
    if (!over) return;

    const activeId = String(active.id);

    // Тянем новый тип блока из палитры
    if (activeId.startsWith("new:")) {
      const type = activeId.slice(4) as BlockType;
      const overId = String(over.id);

      let at: number | null;
      if (overId.startsWith("zone:")) {
        at = Number(overId.slice(5));
      } else {
        const idx = blocks.findIndex((b) => String(b.id) === overId);
        at = idx === -1 ? null : idx;
      }

      await handleAdd(type, at);
      return;
    }

    // Обычный reorder существующих блоков
    if (active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(blocks, oldIndex, newIndex);
    setBlocks(next);
    setInsertAt(null);

    try {
      await reorderAdminBlocks(
        postId,
        next.map((b) => b.id)
      );
      await load(true);
    } catch (err) {
      alert((err as Error).message);
      load(true);
    }
  };

  if (loading) {
    return <p>Загрузка блоков...</p>;
  }

  return (
    <div className="block-editor">
      {error && <div className="error-message">{error}</div>}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setDragLabel(null)}
      >
        <div className="block-editor-layout">
          {/* Sticky-палитра слева */}
          <aside className="block-palette">
            <div className="block-palette-title">Блоки</div>
            <div className="block-palette-hint">
              {insertAt !== null
                ? insertAt >= blocks.length
                  ? "Вставка: в конец списка"
                  : `Вставка: перед блоком ${insertAt + 1}`
                : "Клик — добавить. Перетащи тип блока на линию между блоками"}
            </div>

            {addableBlocks.map((b) => (
              <PaletteItem
                key={b.type}
                type={b.type}
                label={b.label}
                disabled={busy}
                onClick={() => handleAdd(b.type, insertAt)}
              />
            ))}

            {insertAt !== null && (
              <button
                type="button"
                className="block-palette-reset"
                onClick={() => setInsertAt(null)}
              >
                ↩ Сбросить (в конец)
              </button>
            )}
          </aside>

          {/* Список блоков с дроп-зонами */}
          <div className="block-editor-content">
            <div className="block-editor-toolbar">
              <div className="block-editor-toolbar-title">
                Блочный редактор
              </div>
              <div className="block-editor-toolbar-hint">
                Перетаскивай блоки за ручку или тяни новые типы из палитры
                слева на линии между блоками.
              </div>
            </div>

            {blocks.length === 0 && (
              <div className="block-editor-empty">
                Блоков пока нет — перетащи тип из палитры сюда или кликни
                по типу.
              </div>
            )}

            <SortableContext
              items={blockIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="block-editor-list">
                {blocks.map((block, i) => (
                  <Fragment key={block.id}>
                    <DropZone
                      index={i}
                      total={blocks.length}
                      active={insertAt === i}
                      busy={busy}
                      onToggle={toggleInsertAt}
                      onAdd={handleAdd}
                    />
                    <SortableBlockItem
                      block={block}
                      busy={busy}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                      onUpdateLocal={handleUpdateLocal}
                      onSave={handleSave}
                    />
                  </Fragment>
                ))}

                <DropZone
                  index={blocks.length}
                  total={blocks.length}
                  active={insertAt === blocks.length}
                  busy={busy}
                  onToggle={toggleInsertAt}
                  onAdd={handleAdd}
                />
              </div>
            </SortableContext>
          </div>
        </div>

        <DragOverlay>
          {dragLabel ? (
            <div className="block-drag-chip">
              + {blockLabels[dragLabel] || dragLabel}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
