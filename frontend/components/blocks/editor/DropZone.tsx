"use client";

import { useDroppable } from "@dnd-kit/core";
import type { BlockType } from "@/lib/api/blocks";
import { addableBlocks } from "./constants";

type Props = {
  index: number;
  total: number;
  active: boolean;
  busy: boolean;
  onToggle: (index: number) => void;
  onAdd: (type: BlockType, index: number) => void;
};

export default function DropZone({
  index,
  total,
  active,
  busy,
  onToggle,
  onAdd,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: `zone:${index}` });

  return (
    <div
      ref={setNodeRef}
      className={
        "block-dropzone" +
        (active ? " is-active" : "") +
        (isOver ? " is-over" : "")
      }
    >
      <button
        type="button"
        className="block-dropzone-line"
        disabled={busy}
        onClick={() => onToggle(index)}
        title={
          index >= total
            ? "Вставить в конец"
            : `Вставить перед блоком ${index + 1}`
        }
      >
        <span className="block-dropzone-plus">+</span>
      </button>

      {active && (
        <div className="block-dropzone-palette">
          {addableBlocks.map((b) => (
            <button
              key={b.type}
              type="button"
              disabled={busy}
              onClick={() => onAdd(b.type, index)}
            >
              + {b.label}
            </button>
          ))}
          <button
            type="button"
            className="block-dropzone-cancel"
            onClick={() => onToggle(index)}
          >
            Отмена
          </button>
        </div>
      )}
    </div>
  );
}
