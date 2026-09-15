"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api/client";
import "@/styles/admin/polls.css";

type PollItem = {
  block_id: number;
  post_id: number;
  post_title: string;
  post_slug: string;
  question: string;
  options: string[];
  multiple: boolean;
  counts: number[];
  total: number;
};

export default function PollsPage() {
  const [items, setItems] = useState<PollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<{ items: PollItem[] }>("/api/v1/admin/polls")
      .then((res) => setItems(res.items || []))
      .catch((e) => setError(e.message || "ошибка загрузки"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="admin-container">
      <h1>Опросы</h1>
      {loading && <p>Загрузка...</p>}
      {error && <p className="error">Ошибка: {error}</p>}

      {!loading && items.length === 0 && (
        <p className="empty">Опросов пока нет</p>
      )}

      {!loading && items.length > 0 && (
        <div className="polls-table">
          {items.map((item) => (
            <div key={item.block_id} className="poll-card">
              <div className="poll-card-head">
                <Link href={`/admin/posts/${item.post_id}/edit?tab=content`}>
                  <strong>{item.post_title}</strong>
                </Link>
                <span className="poll-badge">
                  {item.multiple ? "множественный" : "один вариант"}
                </span>
              </div>
              <div className="poll-card-question">
                {item.question || <em>(без вопроса)</em>}
              </div>
              <div className="poll-card-results">
                {item.options.map((opt, i) => {
                  const count = item.counts[i] || 0;
                  const pct =
                    item.total > 0
                      ? Math.round((count / item.total) * 100)
                      : 0;
                  return (
                    <div key={i} className="poll-result-row">
                      <div className="poll-result-label">
                        <span>{opt}</span>
                        <span>
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="poll-bar">
                        <div
                          className="poll-bar-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="poll-card-footer">
                Всего голосов: <strong>{item.total}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
