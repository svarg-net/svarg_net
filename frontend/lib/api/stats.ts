import { apiGet, apiPost } from "./client";

export type PopularPost = {
  id: number;
  title: string;
  slug: string;
  views: number;
};

export type PostStats = {
  id: number;
  title: string;
  slug: string;
  views: number;
  unique: number;
  last_view_at: string | null;
};

export type DailyStats = {
  date: string;
  views: number;
  unique: number;
};

export type StatsSummary = {
  total_views: number;
  total_unique: number;
  views_today: number;
  unique_today: number;
};

export type AdminStats = {
  summary: StatsSummary;
  posts: PostStats[];
  daily: DailyStats[];
};

/** Зарегистрировать просмотр поста. Возвращает текущее число просмотров. */
export async function recordPostView(slug: string): Promise<number> {
  const res = await apiPost<{ views: number }>(`/api/v1/posts/${slug}/view`, {});
  return res.views;
}

/** Получить число просмотров поста */
export async function getPostViews(slug: string): Promise<number> {
  const res = await apiGet<{ views: number }>(`/api/v1/posts/${slug}/views`);
  return res.views;
}

/** Топ-N популярных постов */
export async function getPopularPosts(limit = 5): Promise<PopularPost[]> {
  const res = await apiGet<{ items: PopularPost[] }>(
    `/api/v1/posts/popular?limit=${limit}`
  );
  return res.items ?? [];
}

/** Полная статистика для админки */
export async function getAdminStats(days = 30): Promise<AdminStats> {
  return apiGet<AdminStats>(`/api/v1/admin/stats?days=${days}`);
}
