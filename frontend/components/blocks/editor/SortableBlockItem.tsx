"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Block } from "@/lib/api/blocks";
import BlockFields from "./BlockFields";
import { blockLabels } from "./constants";

type Props = {
  block: Block;
  busy: boolean;
  onDelete: (id: number) => void;
  onDuplicate: (block: Block) => void;
  onUpdateLocal: (id: number, data: Record<string, unknown>) => void;
  onSave: (block: Block) => void;
};

export default function SortableBlockItem({
  block,
  busy,
  onDelete,
  onDuplicate,
  onUpdateLocal,
  onSave,
}: Props) {
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
