import { apiGet, apiPost, apiDelete } from "../client";
import type { Comment } from "../public/comments";

export * from "../public/comments";

export type PendingComment = Comment & {
  post_title?: string;
  author_email?: string;
};

export async function getPendingComments(
  limit = 50,
  offset = 0
): Promise<{ items: PendingComment[] }> {
  return apiGet<{ items: PendingComment[] }>(
    `/api/v1/admin/comments/pending?limit=${limit}&offset=${offset}`
  );
}

export async function getPendingCount(): Promise<{ count: number }> {
  return apiGet<{ count: number }>(`/api/v1/admin/comments/count`);
}

export async function approveComment(id: number): Promise<void> {
  await apiPost(`/api/v1/admin/comments/${id}/approve`, {});
}

export async function rejectComment(id: number): Promise<void> {
  await apiPost(`/api/v1/admin/comments/${id}/reject`, {});
}

export async function deleteComment(id: number): Promise<void> {
  await apiDelete(`/api/v1/admin/comments/${id}`);
}
