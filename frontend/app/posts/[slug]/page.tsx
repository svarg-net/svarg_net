import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/api";

export const dynamic = "force-dynamic";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Простой парсер markdown в HTML (без внешних библиотек)
function markdownToHtml(md: string): string {
  let html = md;

  // Заголовки
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // Жирный текст
  html = html.replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>");

  // Курсив
  html = html.replace(/\*(.*?)\*/gim, "<em>$1</em>");

  // Код в строке
  html = html.replace(/`(.*?)`/gim, "<code>$1</code>");

  // Блоки кода
  html = html.replace(/```([\s\S]*?)```/gim, "<pre><code>$1</code></pre>");

  // Ссылки
  html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>');

  // Параграфы
  html = html
    .split("\n\n")
    .map((p) => {
      if (
        p.startsWith("<h") ||
        p.startsWith("<pre") ||
        p.startsWith("<ul")
      ) {
        return p;
      }
      return `<p>${p.trim()}</p>`;
    })
    .join("\n");

  return html;
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

  const contentHtml = markdownToHtml(post.content_md);

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
        <div
          className="content"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </article>
    </div>
  );
}