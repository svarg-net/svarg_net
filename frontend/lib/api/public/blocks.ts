import type { PlateValue } from "@/lib/plate-types";

// ===== Типы блоков =====

export type BlockType =
  | "text"
  | "image"
  | "image-text"
  | "code"
  | "gallery"
  | "quote"
  | "callout"
  | "divider"
  | "table"
  | "video"
  | "tabs"
  | "quiz"
  | "poll";

export type Block = {
  id: number;
  post_id: number;
  type: BlockType | string;
  data: Record<string, unknown>;
  position: number;
  created_at: string;
  updated_at: string;
};

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

export type TableBlockData = {
  header?: boolean;
  rows?: string[][];
};

export type VideoBlockData = {
  url?: string;
  provider?: string;
  caption?: string;
};

export type TabsItem = {
  title?: string;
  content_json?: PlateValue;
};

export type TabsBlockData = {
  items?: TabsItem[];
};

export type QuizQuestion = {
  question?: string;
  options?: string[];
  correct_index?: number;
  explanation?: string;
};

export type QuizBlockData = {
  title?: string;
  questions?: QuizQuestion[];
};

export type PollBlockData = {
  question?: string;
  options?: string[];
  multiple?: boolean;
};

export type PollResults = {
  counts: number[];
  total: number;
  voted: boolean;
};

// ===== Хелперы =====

export function mediaUrl(id: number): string {
  return `/api/v1/media/${id}/file`;
}

export function resolveImageSrc(item: {
  media_id?: number;
  url?: string;
}): string {
  if (item.media_id) return mediaUrl(item.media_id);
  return item.url || "";
}

// ===== Server-side fetch (SSR/SEO) =====

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

// ===== Опросы (публично) =====

export async function getPollResults(blockId: number): Promise<PollResults> {
  const res = await fetch(`/api/v1/blocks/${blockId}/poll`);
  if (!res.ok) throw new Error("failed to load poll results");
  return res.json();
}

export async function votePoll(
  blockId: number,
  optionIndexes: number[]
): Promise<void> {
  const res = await fetch(`/api/v1/blocks/${blockId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ option_indexes: optionIndexes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "vote failed" }));
    throw new Error(err.error || "vote failed");
  }
}
