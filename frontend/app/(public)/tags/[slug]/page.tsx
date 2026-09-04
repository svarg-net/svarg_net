import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTagBySlug, getPostsByTag, type Post } from "@/lib/api";
import Pagination from "@/components/Pagination";

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
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);

  if (!tag) {
    return {
      title: "Тег не найден",
    };
  }

  const url = `https://svarg.net/tags/${tag.slug}`;
  const title = tag.meta_title || `Тег: ${tag.name}`;
  const description = tag.meta_description || `Статьи с тегом ${tag.name}`;
  const ogImage = tag.og_image || "/og-image.png";

  return {
    title,
    description,
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url,
      title,
      description,
      siteName: "SVARG_NET",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
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
  };
}

export default async function TagPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageStr } = await searchParams;
  const page = parseInt(pageStr || "1", 10) || 1;
  const perPage = 10;

  const tag = await getTagBySlug(slug);

  if (!tag) {
    notFound();
  }

  let posts: Post[] = [];
  let total = 0;
  try {
    const response = await getPostsByTag(tag.slug, "published", page, perPage);
    posts = response.items || [];
    total = response.total || 0;
  } catch (err) {
    console.error("Failed to fetch posts by tag:", err);
  }

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="container">
      <h1>Тег: #{tag.name}</h1>

      {posts.length === 0 ? (
        <div className="empty-state">
          <p>Статей с этим тегом пока нет</p>
        </div>
      ) : (
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
                  </div>
                </Link>
              </article>
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            baseUrl={`/tags/${tag.slug}`}
          />
        </>
      )}
    </div>
  );
}
