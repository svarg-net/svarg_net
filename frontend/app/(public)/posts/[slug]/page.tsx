import Link from "next/link";
import { notFound } from "next/navigation";
import PlateRenderer from "@/components/PlateRenderer";
import {
  getPostBySlug,
  getCategories,
  type Category,
} from "@/lib/api";
import type { PlateValue } from "@/lib/plate-types";
import PostViewCounter from "@/components/PostViewCounter";
import { getPostViews } from "@/lib/api/stats";
import CommentList from "@/components/CommentList";
import BlockRenderer from "@/components/blocks/BlockRenderer";
import { getPostBlocks } from "@/lib/api/blocks";
import { buildPostMetadata } from "@/lib/seo/postMetadata";
import { formatDate } from "@/lib/seo/format";
import ArticleJsonLd from "@/components/seo/ArticleJsonLd";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return { title: "Статья не найдена" };
  }

  return buildPostMetadata(post);
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  let initialViews = 0;
  try {
    initialViews = await getPostViews(slug);
  } catch {
    // тихо игнорируем
  }

  let categories: Category[] = [];
  try {
    const catResponse = await getCategories();
    categories = catResponse.items || [];
  } catch (err) {
    console.error("Failed to load categories:", err);
  }

  const postCategory = categories.find((c) => c.id === post.category_id);
  const blocks =
    post.content_mode === "blocks"
      ? await getPostBlocks(post.slug)
      : [];

  return (
    <>
      <ArticleJsonLd post={post} />
      <div className="container">
        <Link href="/" className="back-link">
          ← Назад к списку
        </Link>

        <article className="post-content">
          <header>
            <h1>{post.title}</h1>
            <div className="meta">
              <time dateTime={post.published_at || post.created_at}>
                {formatDate(post.published_at || post.created_at)}
              </time>
              <span style={{ marginLeft: "15px" }}>
                <PostViewCounter
                  slug={post.slug}
                  initialViews={initialViews}
                />
              </span>
              {postCategory && (
                <span style={{ marginLeft: "15px" }}>
                  Категория:{" "}
                  <Link href={`/categories/${postCategory.slug}`}>
                    {postCategory.name}
                  </Link>
                </span>
              )}
            </div>
            {post.tags && post.tags.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginTop: "10px",
                  flexWrap: "wrap",
                }}
              >
                {post.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tags/${tag.slug}`}
                    style={{
                      padding: "4px 12px",
                      background: "#f0f0f0",
                      borderRadius: "12px",
                      fontSize: "0.875rem",
                      textDecoration: "none",
                      color: "#333",
                    }}
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}
          </header>

          {post.content_mode === "blocks" ? (
            <BlockRenderer blocks={blocks} />
          ) : post.content_json && Array.isArray(post.content_json) ? (
            <PlateRenderer content={post.content_json as PlateValue} />
          ) : post.content_md ? (
            <pre style={{ whiteSpace: "pre-wrap" }}>{post.content_md}</pre>
          ) : (
            <p>Контент отсутствует</p>
          )}
        </article>

        <CommentList
          postId={post.id}
          postSlug={post.slug}
          commentsEnabled={post.comments_enabled ?? true}
        />
      </div>
    </>
  );
}
