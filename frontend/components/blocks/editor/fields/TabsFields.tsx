"use client";

import PlateEditor from "@/components/site/PlateEditor";
import type { TabsBlockData, TabsItem } from "@/lib/api/public/blocks";
import { emptyPlate } from "../constants";

type Props = {
  data: TabsBlockData;
  onChange: (data: Record<string, unknown>) => void;
};

export default function TabsFields({ data, onChange }: Props) {
  const items: TabsItem[] =
    data.items && data.items.length > 0
      ? data.items
      : [{ title: "Вкладка 1", content_json: emptyPlate }];

  const setItems = (next: TabsItem[]) => onChange({ ...data, items: next });

  const updateItem = (i: number, patch: Partial<TabsItem>) =>
    setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const addItem = () =>
    setItems([
      ...items,
      { title: `Вкладка ${items.length + 1}`, content_json: emptyPlate },
    ]);

  const removeItem = (i: number) =>
    items.length > 1 && setItems(items.filter((_, idx) => idx !== i));

  return (
    <div className="block-editor-field">
      <label>Вкладки ({items.length})</label>
      {items.map((item, i) => (
        <div key={i} className="tabs-editor-item">
          <div className="tabs-editor-head">
            <input
              value={item.title || ""}
              placeholder={`Название вкладки ${i + 1}`}
              onChange={(e) => updateItem(i, { title: e.target.value })}
            />
            <button
              type="button"
              className="danger"
              onClick={() => removeItem(i)}
            >
              Удалить
            </button>
          </div>
          <PlateEditor
            initialValue={item.content_json || emptyPlate}
            onChange={(next) => updateItem(i, { content_json: next })}
          />
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={addItem}>
        + Добавить вкладку
      </button>
    </div>
  );
}
