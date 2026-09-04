import { apiGet } from "./client";
import type { Post } from "./types";

export type { Post };

export type SearchResponse = {
  items: Post[];
  total: number;
  query: string;
};

export async function searchPosts(
  query: string,
  limit = 20,
  offset = 0
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    offset: String(offset),
  });
  return apiGet<SearchResponse>(`/api/v1/search?${params}`);
}
