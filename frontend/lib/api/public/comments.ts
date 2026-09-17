import { apiGet, apiPost } from "../client";

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

export async function getCommentToken(slug: string): Promise<string> {
  const res = await apiGet<{ token: string }>(
    `/api/v1/posts/${slug}/comment-token`
  );
  return res.token;
}

export async function getComments(slug: string): Promise<CommentListResponse> {
  return apiGet<CommentListResponse>(`/api/v1/posts/${slug}/comments`);
}

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
