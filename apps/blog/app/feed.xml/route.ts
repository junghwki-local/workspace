import { getPosts } from "@/lib/wordpress/api";
import { stripHtml } from "@/lib/utils";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://your-domain.com";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const { posts } = await getPosts({ perPage: 20 }).catch(() => ({ posts: [] }));

  const items = posts
    .map((post) => {
      const title = escapeXml(stripHtml(post.title.rendered));
      const description = escapeXml(stripHtml(post.excerpt.rendered).slice(0, 300));
      const link = `${BASE_URL}/post/${post.slug}`;
      const pubDate = new Date(post.date).toUTCString();

      return `
    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blog</title>
    <link>${BASE_URL}/blog</link>
    <description>WordPress Headless Blog powered by Next.js</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
