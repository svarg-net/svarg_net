"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  approveComment,
  deleteComment,
  getPendingComments,
  rejectComment,
  type PendingComment,
} from "@/lib/api/comments";

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<PendingComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await getPendingComments(100, 0);
      setComments(res.items ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (id: number) => {
    setActionInProgress(id);
    try {
      await approveComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert("Ошибка: " + (err as Error).message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm("Отклонить комментарий? Его увидит только админ.")) return;
    setActionInProgress(id);
    try {
      await rejectComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert("Ошибка: " + (err as Error).message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить комментарий навсегда?")) return;
    setActionInProgress(id);
    try {
      await deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert("Ошибка: " + (err as Error).message);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>💬 Очередь модерации</h1>
        <div className="admin-nav">
          <Link href="/">На сайт</Link>
        </div>
      </div>

      {error && <div className="error-message">Ошибка: {error}</div>}
      {loading && <p>Загрузка...</p>}

      {!loading && comments.length === 0 && (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "#888",
            background: "#fafafa",
            borderRadius: "10px",
          }}
        >
          🎉 Нет комментариев на модерации
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {comments.map((c) => (
          <div
            key={c.id}
            style={{
              background: "#fff",
              border: "1px solid #e5e5e5",
              borderRadius: "10px",
              padding: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "12px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div>
                <strong>{c.author_name}</strong>
                {c.author_email && (
                  <span style={{ color: "#888", marginLeft: "8px", fontSize: "13px" }}>
                    {c.author_email}
                  </span>
                )}
                <span style={{ color: "#888", marginLeft: "12px", fontSize: "12px" }}>
                  {new Date(c.created_at).toLocaleString("ru-RU")}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#888" }}>
                К посту: <strong>#{c.post_id}</strong>
                {c.parent_id && ` (ответ на #${c.parent_id})`}
              </div>
            </div>

            <div
              style={{
                background: "#fafafa",
                padding: "12px 16px",
                borderRadius: "6px",
                whiteSpace: "pre-wrap",
                fontFamily: "monospace",
                fontSize: "14px",
                lineHeight: "1.5",
                marginBottom: "14px",
              }}
            >
              {c.content}
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                onClick={() => handleApprove(c.id)}
                disabled={actionInProgress === c.id}
                style={{
                  padding: "8px 16px",
                  background: "#27ae60",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                ✓ Одобрить
              </button>
              <button
                onClick={() => handleReject(c.id)}
                disabled={actionInProgress === c.id}
                style={{
                  padding: "8px 16px",
                  background: "#e67e22",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                ✗ Отклонить
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                disabled={actionInProgress === c.id}
                style={{
                  padding: "8px 16px",
                  background: "#fff",
                  color: "#c33",
                  border: "1px solid #c33",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                🗑 Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
