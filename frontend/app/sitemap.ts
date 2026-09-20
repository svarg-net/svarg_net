import type { MetadataRoute } from "next";
import { getCategories, getPosts, getTags, getPublicCourses, getPublicLessons } from "@/lib/api";

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

  
  // Курсы и уроки
  try {
    const { items: courses } = await getPublicCourses();
    for (const course of courses) {
      entries.push({
        url: `${SITE_URL}/courses/${course.slug}`,
        lastModified: new Date(course.updated_at),
        changeFrequency: "weekly",
        priority: 0.8,
      });

      const { items: lessons } = await getPublicLessons(course.slug);
      for (const lesson of lessons) {
        entries.push({
          url: `${SITE_URL}/courses/${course.slug}/${lesson.slug}`,
          lastModified: new Date(lesson.updated_at),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
  } catch (error) {
    console.error("sitemap: failed to load courses", error);
  }

  return entries;
}
