import type { MetadataRoute } from "next";
import { getPosts, getCategories } from "@/lib/wordpress/api";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://your-domain.com";

async function getAllPosts() {
  const first = await getPosts({ perPage: 100, page: 1 }).catch(() => ({ posts: [], totalPages: 1 }));
  if (first.totalPages <= 1) return first.posts;

  const pages = Array.from({ length: first.totalPages - 1 }, (_, i) => i + 2);
  const rest = await Promise.all(
    pages.map((page) => getPosts({ perPage: 100, page }).catch(() => ({ posts: [] })))
  );
  return [...first.posts, ...rest.flatMap((r) => r.posts)];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories] = await Promise.all([
    getAllPosts(),
    getCategories().catch(() => []),
  ]);

  const postUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/post/${post.slug}`,
    lastModified: new Date(post.modified),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const categoryUrls: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${BASE_URL}/blog?category=${cat.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    ...categoryUrls,
    ...postUrls,
  ];
}
