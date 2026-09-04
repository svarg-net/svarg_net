import Link from "next/link";
import type { Metadata } from "next";
import { getPosts, type Post } from "@/lib/api";
import Pagination from "@/components/Pagination";

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

function WebsiteJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SVARG_NET",
    url: "https://svarg.net",
    description: "Технический блог о Go, Next.js, PostgreSQL и современной веб-разработке",
    publisher: {
      "@type": "Organization",
      name: "SVARG_NET",
      logo: {
        "@type": "ImageObject",
        url: "https://svarg.net/logo.png",
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: "https://svarg.net/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const { page: pageStr } = await searchParams;
  const page = parseInt(pageStr || "1", 10) || 1;
  const perPage = 10;

  let posts: Post[] = [];
  let total = 0;
  let error: string | null = null;

  try {
    const response = await getPosts("published", page, perPage);
    posts = response.items || [];
    total = response.total || 0;
  } catch (err) {
    error = (err as Error).message;
    console.error("Failed to fetch posts:", err);
  }

  const totalPages = Math.ceil(total / perPage);

  return (
    <>
      <WebsiteJsonLd />
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
          <>
            <div className="post-list">
              {posts.map((post) => (
                <article key={post.id} className="post-card">
                  <Link href={`/posts/${post.slug}`}>
                    <h2>{post.title}</h2>
                    {post.excerpt && <p className="excerpt">{post.excerpt}</p>}
                    <div className="meta">
                      <time dateTime={post.published_at || post.created_at}>
                        {formatDate(post.published_at || post.created_at)}
                      </time>
                      {post.tags && post.tags.length > 0 && (
                        <span style={{ marginLeft: "15px" }}>
                          {post.tags.map((tag) => `#${tag.name}`).join(" ")}
                        </span>
                      )}
                    </div>
                  </Link>
                </article>
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} baseUrl="/" />
          </>
        )}
      </div>
    </>
  );
}
