import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/wordpress/api";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://your-domain.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { posts } = await getPosts({ perPage: 100 }).catch(() => ({ posts: [] }));

  const postUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/post/${post.slug}`,
    lastModified: new Date(post.modified),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...postUrls,
  ];
}
