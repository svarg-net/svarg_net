"use client";

import { useEffect, useState } from "react";
import type { Block, PollBlockData, PollResults } from "@/lib/api/blocks";
import { getPollResults, votePoll } from "@/lib/api/blocks";

export default function PollBlock({ block }: { block: Block }) {
  const data = block.data as PollBlockData;
  const options = data.options || [];
  const multiple = data.multiple ?? false;

  const [results, setResults] = useState<PollResults | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPollResults(block.id)
      .then(setResults)
      .catch(() => setResults(null));
  }, [block.id]);

  const toggle = (i: number) => {
    if (multiple) {
      setSelected((prev) =>
        prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
      );
    } else {
      setSelected([i]);
    }
  };

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await votePoll(block.id, selected);
      const r = await getPollResults(block.id);
      setResults(r);
      setSelected([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ошибка голосования");
    } finally {
      setBusy(false);
    }
  };

  if (options.length === 0) return null;

  const showResults = results?.voted ?? false;
  const total = results?.total ?? 0;

  return (
    <div className="block block-poll">
      {data.question && (
        <div className="block-poll-question">{data.question}</div>
      )}

      {!showResults ? (
        <>
          <div className="block-poll-options">
            {options.map((opt, i) => (
              <label
                key={i}
                className={
                  "block-poll-option" +
                  (selected.includes(i) ? " is-selected" : "")
                }
              >
                <input
                  type={multiple ? "checkbox" : "radio"}
                  name={`poll-${block.id}`}
                  checked={selected.includes(i)}
                  onChange={() => toggle(i)}
                />
                {opt}
              </label>
            ))}
          </div>
          {error && <div className="block-poll-error">{error}</div>}
          <button
            type="button"
            className="block-poll-submit"
            disabled={selected.length === 0 || busy}
            onClick={submit}
          >
            {busy ? "Отправка..." : "Голосовать"}
          </button>
        </>
      ) : (
        <div className="block-poll-results">
          {options.map((opt, i) => {
            const count = results?.counts[i] ?? 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={i} className="block-poll-result-row">
                <div className="block-poll-result-label">
                  <span>{opt}</span>
                  <span>
                    {count} ({pct}%)
                  </span>
                </div>
                <div className="block-poll-bar">
                  <div
                    className="block-poll-bar-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          <div className="block-poll-total">Всего голосов: {total}</div>
        </div>
      )}
    </div>
  );
}
