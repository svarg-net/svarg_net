import { getPosts } from "@/lib/api";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.SITE_URL || "https://svarg.net";
const SITE_TITLE = "SVARG_NET — блог о технологиях";
const SITE_DESCRIPTION = "Технический блог о Go, Next.js, PostgreSQL и современной веб-разработке";

export async function GET() {
  try {
    const response = await getPosts("published", 1, 20);
    const posts = response.items || [];

    const items = posts
      .map((post) => {
        const pubDate = new Date(post.published_at || post.created_at).toUTCString();
        const excerpt = post.excerpt || post.title;
        const url = `${SITE_URL}/posts/${post.slug}`;

        return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description><![CDATA[${excerpt}]]></description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
      })
      .join("\n");

    const lastBuildDate =
      posts.length > 0
        ? new Date(posts[0].updated_at || posts[0].created_at).toUTCString()
        : new Date().toUTCString();

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_TITLE}</title>
    <link>${SITE_URL}</link>
    <description>${SITE_DESCRIPTION}</description>
    <language>ru</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

    return new Response(rss, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "s-maxage=3600, stale-while-revalidate",
      },
    });
  } catch (error) {
    console.error("RSS feed error:", error);
    return new Response("Error generating RSS feed", { status: 500 });
  }
}
