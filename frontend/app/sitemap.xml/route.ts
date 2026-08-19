import { getPosts } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = "https://svarg.net"; // Замени на свой домен

  try {
    const response = await getPosts("published", 1, 1000);
    const posts = response.items || [];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/admin/login</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
${posts
  .map(
    (post) => `  <url>
    <loc>${baseUrl}/posts/${post.slug}</loc>
    <lastmod>${new Date(post.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  } catch (error) {
    return new Response("Error generating sitemap", { status: 500 });
  }
}