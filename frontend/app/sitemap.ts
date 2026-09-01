import type { MetadataRoute } from "next";
import { getCategories, getPosts, getTags } from "@/lib/api";

const SITE_URL = process.env.SITE_URL || "https://svarg.net";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  // Посты (только опубликованные)
  try {
    const posts = await getPosts("published", 1, 1000);
    for (const post of posts.items ?? []) {
      entries.push({
        url: `${SITE_URL}/posts/${post.slug}`,
        lastModified: new Date(post.updated_at || post.created_at),
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  } catch (error) {
    console.error("sitemap: failed to load posts", error);
  }

  // Категории
  try {
    const categories = await getCategories();
    for (const category of categories.items ?? []) {
      entries.push({
        url: `${SITE_URL}/categories/${category.slug}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch (error) {
    console.error("sitemap: failed to load categories", error);
  }

  // Теги
  try {
    const tags = await getTags();
    for (const tag of tags.items ?? []) {
      entries.push({
        url: `${SITE_URL}/tags/${tag.slug}`,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  } catch (error) {
    console.error("sitemap: failed to load tags", error);
  }

  return entries;
}
