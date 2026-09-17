import { apiGet } from "../client";

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

export async function getAdminStats(days = 30): Promise<AdminStats> {
  return apiGet<AdminStats>(`/api/v1/admin/stats?days=${days}`);
}
