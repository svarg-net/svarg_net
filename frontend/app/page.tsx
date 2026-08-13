import Link from "next/link";
import type { Metadata } from "next";
import { getPosts } from "@/lib/api";

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
  try {
    const { items: posts } = await getPosts("published");

    return (
      <div className="container">
        <h1>SVARG_NET</h1>

        {posts.length === 0 ? (
          <div className="empty-state">
            <p>Пока нет опубликованных статей</p>
          </div>
        ) : (
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
  } catch (error) {
    return (
      <div className="container">
        <h1>SVARG_NET</h1>
        <div className="error-state">
          <p>Не удалось загрузить статьи</p>
          <p>{(error as Error).message}</p>
        </div>
      </div>
    );
  }
}