// Переэкспорт всех API функций и типов для удобства импорта

// Типы
export * from "./types";

// Auth
export { login, getMe } from "./auth";

// Posts
export {
  getPosts,
  getPostBySlug,
  getPostsByCategory,
  getPostsByTag,
  createPost,
  updatePost,
  deletePost,
} from "./posts";

// Categories
export {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./categories";

// Tags
export {
  getTags,
  getTagBySlug,
  createTag,
  updateTag,
  deleteTag,
} from "./tags";

// Client utilities
export { getApiUrl } from "./client";