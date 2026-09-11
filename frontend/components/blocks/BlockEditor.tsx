"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
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
import { addableBlocks } from "./editor/constants";
import "@/styles/block-editor.css";

type Props = {
  postId: number;
};

export default function BlockEditor({ postId }: Props) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setBlocks(await getAdminBlocks(postId));
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
      await createAdminBlock(postId, {
        type: block.type as BlockType,
        data: block.data,
        position: block.position + 1,
      });
      await load();
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
          <div className="block-editor-toolbar-title">Блочный редактор</div>
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
