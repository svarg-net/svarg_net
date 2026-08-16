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

function formatDateISO(dateString: string): string {
  return new Date(dateString).toISOString();
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Статья не найдена",
    };
  }

  const url = `https://svarg.net/posts/${post.slug}`;
  const title = post.meta_title || post.title;
  const description = post.meta_description || post.excerpt || post.title;
  const keywords = post.meta_keywords && post.meta_keywords.length > 0
    ? post.meta_keywords
    : post.title.split(" ").filter((word) => word.length > 3);
  const ogImage = post.og_image || "/og-image.png";

  return {
    title,
    description,
    keywords,
    authors: [{ name: "SVARG_NET" }],
    openGraph: {
      type: "article",
      locale: "ru_RU",
      url,
      title,
      description,
      siteName: "SVARG_NET",
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

// JSON-LD разметка для поисковых систем
function ArticleJsonLd({ post }: { post: any }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || post.title,
    image: "https://svarg.net/og-image.png",
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    author: {
      "@type": "Person",
      name: "SVARG_NET",
      url: "https://svarg.net",
    },
    publisher: {
      "@type": "Organization",
      name: "SVARG_NET",
      logo: {
        "@type": "ImageObject",
        url: "https://svarg.net/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://svarg.net/posts/${post.slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

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
            </div>
          </header>

          {post.content_json && Array.isArray(post.content_json) ? (
            <PlateRenderer content={post.content_json} />
          ) : post.content_md ? (
            <pre style={{ whiteSpace: "pre-wrap" }}>{post.content_md}</pre>
          ) : (
            <p>Контент отсутствует</p>
          )}
        </article>
      </div>
    </>
  );
}