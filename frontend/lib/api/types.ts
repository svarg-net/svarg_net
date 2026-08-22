// Типы данных для API

// ==================== User ====================

export type User = {
  id: number;
  email: string;
  username: string;
  display_name?: string;
};

export type LoginResponse = {
  token: string;
  expires_at: number;
  user: User;
};

// ==================== Tags ====================

export type Tag = {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
};

export type TagListResponse = {
  items: Tag[];
  total: number;
};

// ==================== Categories ====================

export type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  created_at: string;
  updated_at: string;
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
};

export type CategoryListResponse = {
  items: Category[];
  total: number;
};

// ==================== Posts ====================

export type Post = {
  id: number;
  author_id: number;
  slug: string;
  title: string;
  excerpt?: string;
  content_md?: string;
  content_json?: unknown[];
  status: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  category_id?: number;
  tags?: Tag[];
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  og_image?: string;
};

export type PostListResponse = {
  items: Post[];
  total: number;
  page: number;
  per_page: number;
};

// Типы для создания/обновления постов
export type PostCreateData = {
  title: string;
  excerpt?: string;
  content_md?: string;
  content_json?: unknown[];
  status: string;
  category_id?: number;
  tag_ids?: number[];
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  og_image?: string;
};

export type PostUpdateData = {
  title?: string;
  excerpt?: string;
  content_md?: string;
  content_json?: unknown[];
  status?: string;
  category_id?: number;
  tag_ids?: number[];
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  og_image?: string;
};

// Типы для создания/обновления категорий
export type CategoryCreateData = {
  name: string;
  description?: string;
  parent_id?: number;
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
};

export type CategoryUpdateData = {
  name?: string;
  description?: string;
  parent_id?: number;
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
};

// Типы для создания/обновления тегов
export type TagCreateData = {
  name: string;
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
};

export type TagUpdateData = {
  name?: string;
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
};