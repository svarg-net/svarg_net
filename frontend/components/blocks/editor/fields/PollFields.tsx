"use client";

import { useEffect, useState } from "react";
import type { PollBlockData } from "@/lib/api/blocks";
import { apiGet } from "@/lib/api/client";

type Props = {
  blockId?: number;
  data: PollBlockData;
  onChange: (data: Record<string, unknown>) => void;
};

type PollResults = {
  counts: number[];
  total: number;
  voted: boolean;
};

export default function PollFields({ blockId, data, onChange }: Props) {
  const options =
    data.options && data.options.length > 0 ? data.options : ["", ""];

  const [results, setResults] = useState<PollResults | null>(null);

  useEffect(() => {
    if (!blockId) return;
    apiGet<PollResults>(`/api/v1/blocks/${blockId}/poll`)
      .then(setResults)
      .catch(() => setResults(null));
  }, [blockId]);

  const setOptions = (next: string[]) =>
    onChange({ ...data, options: next });

  const addOption = () => setOptions([...options, ""]);

  const removeOption = (i: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== i));
  };

  const total = results?.total ?? 0;

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

      {/* Inline-сводка результатов */}
      {blockId && results && total > 0 && (
        <div className="block-editor-field poll-editor-summary">
          <label>Результаты ({total} голосов)</label>
          {options.map((opt, i) => {
            const count = results.counts[i] || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={i} className="poll-editor-summary-row">
                <div className="poll-editor-summary-label">
                  <span>{opt || <em>(пусто)</em>}</span>
                  <span>
                    {count} ({pct}%)
                  </span>
                </div>
                <div className="poll-editor-summary-bar">
                  <div
                    className="poll-editor-summary-bar-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
