import { apiGet, apiPost, apiPatch, apiDelete } from "../client";
import type { Block, BlockType } from "../public/blocks";

export * from "../public/blocks";

export async function getAdminBlocks(postId: number): Promise<Block[]> {
  const res = await apiGet<{ items: Block[] }>(
    `/api/v1/admin/posts/${postId}/blocks`
  );
  return res.items ?? [];
}

export async function createAdminBlock(
  postId: number,
  data: { type: BlockType; data?: Record<string, unknown>; position?: number }
): Promise<Block> {
  return apiPost<Block>(`/api/v1/admin/posts/${postId}/blocks`, data);
}

export async function updateAdminBlock(
  blockId: number,
  data: { type?: BlockType; data?: Record<string, unknown> }
): Promise<Block> {
  return apiPatch<Block>(`/api/v1/admin/blocks/${blockId}`, data);
}

export async function deleteAdminBlock(blockId: number): Promise<void> {
  await apiDelete(`/api/v1/admin/blocks/${blockId}`);
}

export async function reorderAdminBlocks(
  postId: number,
  blockIds: number[]
): Promise<void> {
  await apiPost(`/api/v1/admin/posts/${postId}/blocks/reorder`, {
    block_ids: blockIds,
  });
}

export async function convertPostToBlocks(postId: number): Promise<void> {
  await apiPost(`/api/v1/admin/posts/${postId}/convert-to-blocks`, {});
}
