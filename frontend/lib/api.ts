// ==================== Types ====================

export type Post = {
  id: number;
  author_id: number;
  slug: string;
  title: string;
  excerpt?: string;
  content_md?: string;
  content_json?: any[];
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

// ==================== API URL ====================

const SERVER_API_URL = process.env.BACKEND_URL || "http://localhost:8080";
const CLIENT_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const isServer = typeof window === "undefined";

function getApiUrl(): string {
  return isServer ? SERVER_API_URL : CLIENT_API_URL;
}

// ==================== Posts ====================

export async function getPosts(
  status: string = "published",
  page: number = 1,
  perPage: number = 20
): Promise<PostListResponse> {
  const params = new URLSearchParams({
    status,
    page: String(page),
    per_page: String(perPage),
  });

  const response = await fetch(`${getApiUrl()}/api/v1/posts?${params}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    items: data.items || [],
    total: data.total || 0,
    page: data.page || page,
    per_page: data.per_page || perPage,
  };
}

export async function getPostsByCategory(
  categorySlug: string,
  status: string = "published",
  page: number = 1,
  perPage: number = 20
): Promise<PostListResponse> {
  const params = new URLSearchParams({
    status,
    page: String(page),
    per_page: String(perPage),
  });

  const response = await fetch(
    `${getApiUrl()}/api/v1/categories/${categorySlug}/posts?${params}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch posts by category: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    items: data.items || [],
    total: data.total || 0,
    page: data.page || page,
    per_page: data.per_page || perPage,
  };
}

export async function getPostsByTag(
  tagSlug: string,
  status: string = "published",
  page: number = 1,
  perPage: number = 20
): Promise<PostListResponse> {
  const params = new URLSearchParams({
    status,
    page: String(page),
    per_page: String(perPage),
  });

  const response = await fetch(
    `${getApiUrl()}/api/v1/tags/${tagSlug}/posts?${params}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch posts by tag: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    items: data.items || [],
    total: data.total || 0,
    page: data.page || page,
    per_page: data.per_page || perPage,
  };
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const response = await fetch(`${getApiUrl()}/api/v1/posts/${slug}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch post: ${response.statusText}`);
  }

  return response.json();
}

export async function createPost(
  token: string,
  data: {
    title: string;
    excerpt?: string;
    content_md?: string;
    content_json?: any[];
    status: string;
    category_id?: number;
    tag_ids?: number[];
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string[];
    og_image?: string;
  }
): Promise<Post> {
  const response = await fetch(`${getApiUrl()}/api/v1/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create post");
  }

  return response.json();
}

export async function updatePost(
  token: string,
  id: number,
  data: {
    title: string;
    excerpt?: string;
    content_md?: string;
    content_json?: any[];
    status?: string;
    category_id?: number;
    tag_ids?: number[];
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string[];
    og_image?: string;
  }
): Promise<Post> {
  const response = await fetch(`${getApiUrl()}/api/v1/posts/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update post");
  }

  return response.json();
}

export async function deletePost(token: string, id: number): Promise<void> {
  const response = await fetch(`${getApiUrl()}/api/v1/posts/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete post");
  }
}

// ==================== Categories ====================

export async function getCategories(): Promise<CategoryListResponse> {
  const response = await fetch(`${getApiUrl()}/api/v1/categories`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    items: data.items || [],
    total: data.total || 0,
  };
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const response = await fetch(`${getApiUrl()}/api/v1/categories/${slug}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch category: ${response.statusText}`);
  }

  return response.json();
}

export async function createCategory(
  token: string,
  data: {
    name: string;
    description?: string;
    parent_id?: number;
    meta_title?: string;
    meta_description?: string;
    og_image?: string;
  }
): Promise<Category> {
  const response = await fetch(`${getApiUrl()}/api/v1/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create category");
  }

  return response.json();
}

export async function updateCategory(
  token: string,
  id: number,
  data: {
    name?: string;
    description?: string;
    parent_id?: number;
    meta_title?: string;
    meta_description?: string;
    og_image?: string;
  }
): Promise<Category> {
  const response = await fetch(`${getApiUrl()}/api/v1/categories/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update category");
  }

  return response.json();
}

export async function deleteCategory(token: string, id: number): Promise<void> {
  const response = await fetch(`${getApiUrl()}/api/v1/categories/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete category");
  }
}

// ==================== Tags ====================

export async function getTags(): Promise<TagListResponse> {
  const response = await fetch(`${getApiUrl()}/api/v1/tags`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tags: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    items: data.items || [],
    total: data.total || 0,
  };
}

export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const response = await fetch(`${getApiUrl()}/api/v1/tags/${slug}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch tag: ${response.statusText}`);
  }

  return response.json();
}

export async function createTag(
  token: string,
  data: {
    name: string;
    meta_title?: string;
    meta_description?: string;
    og_image?: string;
  }
): Promise<Tag> {
  const response = await fetch(`${getApiUrl()}/api/v1/tags`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create tag");
  }

  return response.json();
}

export async function updateTag(
  token: string,
  id: number,
  data: {
    name?: string;
    meta_title?: string;
    meta_description?: string;
    og_image?: string;
  }
): Promise<Tag> {
  const response = await fetch(`${getApiUrl()}/api/v1/tags/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update tag");
  }

  return response.json();
}

export async function deleteTag(token: string, id: number): Promise<void> {
  const response = await fetch(`${getApiUrl()}/api/v1/tags/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete tag");
  }
}

// ==================== Auth ====================

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${getApiUrl()}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to login");
  }

  return response.json();
}

export async function getMe(token: string): Promise<User> {
  const response = await fetch(`${getApiUrl()}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unauthorized");
  }

  const data = await response.json();
  return data.user;
}