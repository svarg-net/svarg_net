"use client";

import { useState, useEffect } from "react";
import { createComment, getCommentToken } from "@/lib/api/comments";

type Props = {
  postId: number;
  postSlug: string;
  parentId?: number;
  onSubmitted: () => void;
  onCancel?: () => void;
  autofocus?: boolean;
};

export default function CommentForm({
  postId,
  postSlug,
  parentId,
  onSubmitted,
  onCancel,
  autofocus,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [hp, setHp] = useState(""); // honeypot
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Получаем токен при монтировании
  useEffect(() => {
    let cancelled = false;
    getCommentToken(postSlug)
      .then((t) => {
        if (!cancelled) setToken(t);
      })
      .catch(() => {
        if (!cancelled) setTokenError("Не удалось получить токен");
      });
    return () => {
      cancelled = true;
    };
  }, [postSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Комментарии недоступны");
      return;
    }
    if (!name.trim() || !content.trim()) {
      setError("Заполните имя и текст комментария");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await createComment({
        post_id: postId,
        parent_id: parentId,
        author_name: name.trim(),
        author_email: email.trim() || undefined,
        content: content.trim(),
        token,
        hp,
      });
      setName("");
      setEmail("");
      setContent("");
      setHp("");
      setToken(null);
      onSubmitted();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (tokenError) {
    return <p className="comments-closed">{tokenError}</p>;
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      {parentId && (
        <div className="comment-form-header">
          Ответ на комментарий
          {onCancel && (
            <button
              type="button"
              className="comment-form-cancel-link"
              onClick={onCancel}
            >
              отменить
            </button>
          )}
        </div>
      )}

      <div className="comment-form-row">
        <label className="comment-form-label">
          Имя <span className="req">*</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            required
            disabled={submitting}
            autoFocus={autofocus}
          />
        </label>
        <label className="comment-form-label">
          Email <span className="optional">(не публикуется)</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
        </label>
      </div>

      <label className="comment-form-label">
        Комментарий <span className="req">*</span>
        <span className="comment-form-hint">
          Поддерживается: <code>**жирный**</code>, <code>*курсив*</code>,{" "}
          <code>`код`</code>, <code>```блок кода```</code>, <code>&gt; цитата</code>
        </span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={5000}
          rows={6}
          required
          disabled={submitting}
        />
        <span className="comment-form-counter">
          {content.length} / 5000
        </span>
      </label>

      {/* Honeypot — скрытое поле, боты его заполняют */}
      <input
        type="text"
        name="website"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        className="comment-form-hp"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {error && <div className="comment-form-error">{error}</div>}

      <div className="comment-form-actions">
        <button type="submit" disabled={submitting || !token}>
          {submitting ? "Отправка..." : "Отправить"}
        </button>
        {parentId && onCancel && (
          <button type="button" onClick={onCancel} disabled={submitting}>
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}
