"use client";

import { useEffect, useState, useCallback } from "react";
import { getComments, type Comment } from "@/lib/api/comments";
import CommentMarkdown from "@/components/CommentMarkdown";
import CommentForm from "@/components/CommentForm";
import "@/styles/comments.css";
type Props = {
  postId: number;
  postSlug: string;
  commentsEnabled: boolean;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Avatar({ name, gravatarId }: { name: string; gravatarId?: string }) {
  if (gravatarId) {
    return (
      <img
        src={`https://www.gravatar.com/avatar/${gravatarId}?d=retro&s=48`}
        alt=""
        className="comment-avatar"
        loading="lazy"
      />
    );
  }
  const initial = (name.trim()[0] || "?").toUpperCase();
  return (
    <div className="comment-avatar comment-avatar-fallback" aria-hidden="true">
      {initial}
    </div>
  );
}

export default function CommentList({ postId, postSlug, commentsEnabled }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await getComments(postSlug);
      setComments(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch {
      /* тихо */
    } finally {
      setLoading(false);
    }
  }, [postSlug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSubmitted = () => {
    setReplyTo(null);
    refresh();
  };

  return (
    <section className="comments-section" id="comments">
      <h2 className="comments-title">
        Комментарии {total > 0 && <span className="comments-count">({total})</span>}
      </h2>

      {commentsEnabled && (
        <div className="comments-form-wrap">
          <h3>Оставить комментарий</h3>
          <CommentForm
            postId={postId}
            postSlug={postSlug}
            onSubmitted={handleSubmitted}
          />
        </div>
      )}

      {!commentsEnabled && (
        <p className="comments-closed">
          Комментарии к этой статье закрыты.
        </p>
      )}

      {loading && <p>Загрузка комментариев...</p>}

      {!loading && comments.length === 0 && commentsEnabled && (
        <p className="comments-empty">
          Пока нет комментариев. Будьте первым!
        </p>
      )}

      <div className="comments-list">
        {comments.map((c) => (
          <CommentNode
            key={c.id}
            comment={c}
            postId={postId}
            postSlug={postSlug}
            commentsEnabled={commentsEnabled}
            replyTo={replyTo}
            setReplyTo={setReplyTo}
            onSubmitted={handleSubmitted}
            depth={0}
          />
        ))}
      </div>
    </section>
  );
}

type NodeProps = {
  comment: Comment;
  postId: number;
  postSlug: string;
  commentsEnabled: boolean;
  replyTo: number | null;
  setReplyTo: (id: number | null) => void;
  onSubmitted: () => void;
  depth: number;
};

function CommentNode({
  comment,
  postId,
  postSlug,
  commentsEnabled,
  replyTo,
  setReplyTo,
  onSubmitted,
  depth,
}: NodeProps) {
  return (
    <div
      className={"comment-node" + (depth > 0 ? " comment-reply" : "")}
      id={`comment-${comment.id}`}
    >
      <div className="comment-head">
        <Avatar name={comment.author_name} gravatarId={comment.gravatar_id} />
        <div className="comment-meta">
          <span className="comment-author">{comment.author_name}</span>
          <time className="comment-date">{formatDate(comment.created_at)}</time>
        </div>
      </div>

      <div className="comment-body">
        <CommentMarkdown text={comment.content} />
      </div>

      {commentsEnabled && depth === 0 && (
        <div className="comment-actions">
          <button
            type="button"
            className="comment-reply-btn"
            onClick={() => setReplyTo(comment.id)}
          >
            Ответить
          </button>
        </div>
      )}

      {replyTo === comment.id && (
        <div className="comment-reply-form">
          <CommentForm
            postId={postId}
            postSlug={postSlug}
            parentId={comment.id}
            onSubmitted={onSubmitted}
            onCancel={() => setReplyTo(null)}
            autofocus
          />
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-children">
          {comment.replies.map((r) => (
            <CommentNode
              key={r.id}
              comment={r}
              postId={postId}
              postSlug={postSlug}
              commentsEnabled={commentsEnabled}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              onSubmitted={onSubmitted}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
