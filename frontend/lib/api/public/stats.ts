import { apiGet, apiPost } from "../client";

export type PopularPost = {
  id: number;
  title: string;
  slug: string;
  views: number;
};

export async function recordPostView(slug: string): Promise<number> {
  const res = await apiPost<{ views: number }>(`/api/v1/posts/${slug}/view`, {});
  return res.views;
}

export async function getPostViews(slug: string): Promise<number> {
  const res = await apiGet<{ views: number }>(`/api/v1/posts/${slug}/views`);
  return res.views;
}

export async function getPopularPosts(limit = 5): Promise<PopularPost[]> {
  const res = await apiGet<{ items: PopularPost[] }>(
    `/api/v1/posts/popular?limit=${limit}`
  );
  return res.items ?? [];
}
