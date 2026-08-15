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
};

export type PostListResponse = {
  items: Post[];
  total: number;
  page: number;
  per_page: number;
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

// Server-side URL (для server components)
const SERVER_API_URL = process.env.BACKEND_URL || "http://localhost:8080";

// Client-side URL (для client components, используется в браузере)
const CLIENT_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Определяем, где выполняется код
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
  
  // Гарантируем что items всегда массив
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

export async function getPostById(id: number): Promise<Post | null> {
  // Получаем все посты и ищем по id
  const response = await fetch(`${getApiUrl()}/api/v1/posts`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const data: PostListResponse = await response.json();
  return data.items.find((p) => p.id === id) || null;
}
export async function createPost(
  token: string,
  data: {
    title: string;
    excerpt?: string;
    content_md?: string;
    content_json?: any[];
    status: string;
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
    title?: string;
    excerpt?: string;
    content_md?: string;
    content_json?: any[];
    status?: string;
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