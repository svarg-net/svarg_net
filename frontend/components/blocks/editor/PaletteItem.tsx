"use client";

import { useDraggable } from "@dnd-kit/core";

type Props = {
  type: string;
  label: string;
  disabled?: boolean;
  onClick: () => void;
};

export default function PaletteItem({ type, label, disabled, onClick }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `new:${type}`,
    disabled,
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={"block-palette-item" + (isDragging ? " is-dragging" : "")}
      disabled={disabled}
      onClick={onClick}
      title="Клик — добавить. Или перетащи в нужное место списка"
      {...attributes}
      {...listeners}
    >
      + {label}
    </button>
  );
}
