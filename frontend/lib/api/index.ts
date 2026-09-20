// Баррел: реэкспорт всех зон для удобства импорта

export * from "./types";
export { login, getMe } from "./auth";
export { getApiUrl } from "./client";

// Public
export * from "./public/posts";
export * from "./public/categories";
export * from "./public/tags";
export * from "./public/comments";
export * from "./public/blocks";
export * from "./public/stats";
export * from "./public/search";

// Admin
export * from "./admin/posts";
export * from "./admin/categories";
export * from "./admin/tags";
export * from "./admin/comments";
export * from "./admin/blocks";
export * from "./admin/media";
export * from "./admin/stats";
export * from "./admin/courses";
export * from "./public/courses";
export * from "./public/courses";
