import type { Metadata } from "next";
import type { Post } from "@/lib/api";
import { formatDateISO } from "./format";

const SITE_NAME = "SVARG_NET";
const SITE_URL = "https://svarg.net";

/** Собирает Metadata для страницы поста (OG, Twitter, canonical, robots) */
export function buildPostMetadata(post: Post): Metadata {
  const url = `${SITE_URL}/posts/${post.slug}`;
  const title = post.meta_title || post.title;
  const description =
    post.meta_description || post.excerpt || post.title;
  const keywords =
    post.meta_keywords && post.meta_keywords.length > 0
      ? post.meta_keywords
      : post.title.split(" ").filter((word) => word.length > 3);
  const ogImage = post.og_image || "/og-image.png";

  return {
    title,
    description,
    keywords,
    authors: [{ name: SITE_NAME }],
    openGraph: {
      type: "article",
      locale: "ru_RU",
      url,
      title,
      description,
      siteName: SITE_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      publishedTime: post.published_at
        ? formatDateISO(post.published_at)
        : undefined,
      modifiedTime: formatDateISO(post.updated_at),
      section: "Technology",
      tags: post.meta_keywords || [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
