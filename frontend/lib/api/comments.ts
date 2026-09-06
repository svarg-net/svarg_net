import { apiGet, apiPost, apiDelete } from "./client";

export type Comment = {
  id: number;
  post_id: number;
  parent_id: number | null;
  author_name: string;
  content: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  gravatar_id?: string;
  replies?: Comment[];
};

export type CommentListResponse = {
  items: Comment[];
  total: number;
};

export type PendingComment = Comment & {
  post_title?: string;
  author_email?: string;
};

/** Получить одноразовый токен для отправки комментария */
export async function getCommentToken(slug: string): Promise<string> {
  const res = await apiGet<{ token: string }>(
    `/api/v1/posts/${slug}/comment-token`
  );
  return res.token;
}

/** Получить список одобренных комментариев поста (дерево) */
export async function getComments(slug: string): Promise<CommentListResponse> {
  return apiGet<CommentListResponse>(`/api/v1/posts/${slug}/comments`);
}

/** Отправить новый комментарий (возвращает status=pending) */
export async function createComment(data: {
  post_id: number;
  parent_id?: number;
  author_name: string;
  author_email?: string;
  content: string;
  token: string;
  hp?: string;
}): Promise<{ id: number; status: string; message: string }> {
  return apiPost<{ id: number; status: string; message: string }>(
    `/api/v1/comments`,
    data
  );
}

/** Админ: список pending */
export async function getPendingComments(
  limit = 50,
  offset = 0
): Promise<{ items: PendingComment[] }> {
  return apiGet<{ items: PendingComment[] }>(
    `/api/v1/admin/comments/pending?limit=${limit}&offset=${offset}`
  );
}

/** Админ: счётчик pending */
export async function getPendingCount(): Promise<{ count: number }> {
  return apiGet<{ count: number }>(`/api/v1/admin/comments/count`);
}

/** Админ: одобрить */
export async function approveComment(id: number): Promise<void> {
  await apiPost(`/api/v1/admin/comments/${id}/approve`, {});
}

/** Админ: отклонить */
export async function rejectComment(id: number): Promise<void> {
  await apiPost(`/api/v1/admin/comments/${id}/reject`, {});
}

/** Админ: удалить */
export async function deleteComment(id: number): Promise<void> {
  await apiDelete(`/api/v1/admin/comments/${id}`);
}
