import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/api";
import PlateRenderer from "@/components/PlateRenderer";

export const dynamic = "force-dynamic";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Статья не найдена — SVARG_NET",
    };
  }

  return {
    title: `${post.title} — SVARG_NET`,
    description: post.excerpt || post.title,
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="container">
      <Link href="/" className="back-link">
        ← Назад к списку
      </Link>

      <article className="post-content">
        <h1>{post.title}</h1>
        <div className="meta">
          {post.published_at && formatDate(post.published_at)}
        </div>

        {post.content_json && Array.isArray(post.content_json) ? (
          <PlateRenderer content={post.content_json} />
        ) : post.content_md ? (
          <pre style={{ whiteSpace: "pre-wrap" }}>{post.content_md}</pre>
        ) : (
          <p>Контент отсутствует</p>
        )}
      </article>
    </div>
  );
}