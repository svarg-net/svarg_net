import Link from "next/link";
import type { Metadata } from "next";
import { getPosts, type Post } from "@/lib/api";

export const metadata: Metadata = {
  title: "SVARG_NET — блог",
  description: "Список всех статей блога",
};

export const dynamic = "force-dynamic";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function HomePage() {
  let posts: Post[] = [];
  let error: string | null = null;

  try {
    const response = await getPosts("published");
    posts = response.items || [];
  } catch (err) {
    error = (err as Error).message;
    console.error("Failed to fetch posts:", err);
  }

  return (
    <div className="container">
      <h1>SVARG_NET</h1>

      {error && (
        <div className="error-state">
          <p>Не удалось загрузить статьи: {error}</p>
        </div>
      )}

      {!error && posts.length === 0 && (
        <div className="empty-state">
          <p>Пока нет опубликованных статей</p>
          <p>
            <Link href="/admin/login">Войти в админку</Link> и создать первую статью
          </p>
        </div>
      )}

      {!error && posts.length > 0 && (
        <div className="post-list">
          {posts.map((post) => (
            <article key={post.id} className="post-card">
              <Link href={`/posts/${post.slug}`}>
                <h2>{post.title}</h2>
                {post.excerpt && <p className="excerpt">{post.excerpt}</p>}
                <div className="meta">
                  {post.published_at && formatDate(post.published_at)}
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}