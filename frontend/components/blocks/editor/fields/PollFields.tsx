"use client";

import type { PollBlockData } from "@/lib/api/blocks";

type Props = {
  data: PollBlockData;
  onChange: (data: Record<string, unknown>) => void;
};

export default function PollFields({ data, onChange }: Props) {
  const options =
    data.options && data.options.length > 0 ? data.options : ["", ""];

  const setOptions = (next: string[]) =>
    onChange({ ...data, options: next });

  const addOption = () => setOptions([...options, ""]);

  const removeOption = (i: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== i));
  };

  return (
    <>
      <div className="block-editor-field">
        <label>Вопрос опроса</label>
        <input
          value={data.question || ""}
          placeholder="Например: полезна ли эта статья?"
          onChange={(e) => onChange({ ...data, question: e.target.value })}
        />
      </div>

      <div className="block-editor-field">
        <label style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="checkbox"
            checked={data.multiple ?? false}
            onChange={(e) =>
              onChange({ ...data, multiple: e.target.checked })
            }
          />
          Множественный выбор (checkbox вместо radio)
        </label>
      </div>

      <div className="block-editor-field">
        <label>Варианты ответов ({options.length})</label>
        {options.map((opt, i) => (
          <div key={i} className="poll-editor-row">
            <input
              value={opt}
              placeholder={`Вариант ${i + 1}`}
              onChange={(e) =>
                setOptions(
                  options.map((o, idx) => (idx === i ? e.target.value : o))
                )
              }
            />
            <button
              type="button"
              className="danger"
              onClick={() => removeOption(i)}
              disabled={options.length <= 2}
            >
              ×
            </button>
          </div>
        ))}
        <button type="button" className="btn-secondary" onClick={addOption}>
          + Добавить вариант
        </button>
      </div>
    </>
  );
}
