import type { PlateValue } from "@/lib/plate-types";

// ===== Типы блоков (волна 1) =====

export type BlockType =
  | "text"
  | "image"
  | "image-text"
  | "code"
  | "gallery"
  | "quote"
  | "callout"
  | "divider";

export type Block = {
  id: number;
  post_id: number;
  type: BlockType | string;
  data: Record<string, unknown>;
  position: number;
  created_at: string;
  updated_at: string;
};

// ===== Схемы data для каждого типа =====

export type TextBlockData = { content_json?: PlateValue };

export type ImageBlockData = {
  media_id?: number;
  url?: string;
  caption?: string;
  align?: "left" | "center" | "right";
};

export type ImageTextBlockData = {
  media_id?: number;
  url?: string;
  caption?: string;
  layout?: "left" | "right";
  content_json?: PlateValue;
};

export type CodeBlockData = {
  language?: string;
  code?: string;
  filename?: string;
};

export type GalleryItem = {
  media_id?: number;
  url?: string;
  caption?: string;
};

export type GalleryBlockData = {
  items?: GalleryItem[];
  layout?: "grid" | "slider" | "masonry";
};

export type QuoteBlockData = {
  text?: string;
  author?: string;
  source?: string;
};

export type CalloutBlockData = {
  type?: "info" | "warning" | "error" | "success";
  title?: string;
  text?: string;
};

export type DividerBlockData = {
  style?: "line" | "dots" | "space";
};

// ===== Хелперы =====

/** URL файла из медиабиблиотеки */
export function mediaUrl(id: number): string {
  return `/api/v1/media/${id}/file`;
}

/** Resolve изображения: media_id приоритетнее прямого url */
export function resolveImageSrc(item: {
  media_id?: number;
  url?: string;
}): string {
  if (item.media_id) return mediaUrl(item.media_id);
  return item.url || "";
}

// ===== Server-side fetch (для SSR и SEO) =====

export async function getPostBlocks(slug: string): Promise<Block[]> {
  const base =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080";
  try {
    const res = await fetch(
      `${base}/api/v1/posts/${encodeURIComponent(slug)}/blocks`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.items ?? [];
  } catch {
    return [];
  }
}

// ===== Client-side fetch (для админ-редактора) =====

export async function getAdminBlocks(postId: number): Promise<Block[]> {
  const { apiGet } = await import("./client");
  const res = await apiGet<{ items: Block[] }>(
    `/api/v1/admin/posts/${postId}/blocks`
  );
  return res.items ?? [];
}

export async function createAdminBlock(
  postId: number,
  data: {
    type: BlockType;
    data?: Record<string, unknown>;
    position?: number;
  }
): Promise<Block> {
  const { apiPost } = await import("./client");
  return apiPost<Block>(`/api/v1/admin/posts/${postId}/blocks`, data);
}

export async function updateAdminBlock(
  blockId: number,
  data: {
    type?: BlockType;
    data?: Record<string, unknown>;
  }
): Promise<Block> {
  const { apiFetch } = await import("./client");
  return apiFetch<Block>(`/api/v1/admin/blocks/${blockId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAdminBlock(blockId: number): Promise<void> {
  const { apiDelete } = await import("./client");
  await apiDelete(`/api/v1/admin/blocks/${blockId}`);
}

export async function reorderAdminBlocks(
  postId: number,
  blockIds: number[]
): Promise<void> {
  const { apiPost } = await import("./client");
  await apiPost(`/api/v1/admin/posts/${postId}/blocks/reorder`, {
    block_ids: blockIds,
  });
}

export async function convertPostToBlocks(postId: number): Promise<void> {
  const { apiPost } = await import("./client");
  await apiPost(`/api/v1/admin/posts/${postId}/convert-to-blocks`, {});
}