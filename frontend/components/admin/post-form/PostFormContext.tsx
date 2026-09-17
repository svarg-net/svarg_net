"use client";

import { createContext, useContext } from "react";
import type { PlateValue } from "@/lib/plate-types";
import type { Category, Post, Tag } from "@/lib/api";

export type PostFormState = {
  title: string;
  excerpt: string;
  content: PlateValue;
  status: string;
  commentsEnabled: boolean;
  categories: Category[];
  tags: Tag[];
  selectedCategory: number;
  selectedTags: number[];
  newCategoryName: string;
  newTagName: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogImage: string;
};

export type PostFormContextValue = {
  mode: "create" | "edit";
  post?: Post;
  contentMode: string;
  saving: boolean;
  state: PostFormState;
  update: (patch: Partial<PostFormState>) => void;
  addCategory: () => Promise<void>;
  addTag: () => Promise<void>;
  toggleTag: (tagId: number) => void;
  convertToBlocks: () => Promise<void>;
};

export const PostFormContext = createContext<PostFormContextValue | null>(
  null
);

export function usePostForm(): PostFormContextValue {
  const ctx = useContext(PostFormContext);
  if (!ctx) {
    throw new Error("usePostForm must be used within PostForm");
  }
  return ctx;
}
