import type { WPPost, WPCategory, WPTag, PostsResponse } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;

async function wpFetch<T>(path: string): Promise<{ data: T; headers: Headers }> {
  const res = await fetch(`${BASE_URL}/wp-json/wp/v2${path}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`WordPress API error: ${res.status} ${path}`);
  }

  const data = (await res.json()) as T;
  return { data, headers: res.headers };
}

export async function getPosts({
  page = 1,
  perPage = 10,
  search,
  categories,
  tags,
}: {
  page?: number;
  perPage?: number;
  search?: string;
  categories?: number;
  tags?: number;
} = {}): Promise<PostsResponse> {
  const params = new URLSearchParams({
    _embed: "1",
    page: String(page),
    per_page: String(perPage),
  });

  if (search) params.set("search", search);
  if (categories) params.set("categories", String(categories));
  if (tags) params.set("tags", String(tags));

  const { data, headers } = await wpFetch<WPPost[]>(`/posts?${params}`);

  return {
    posts: data,
    total: Number(headers.get("X-WP-Total") ?? 0),
    totalPages: Number(headers.get("X-WP-TotalPages") ?? 1),
  };
}

export async function getPostBySlug(slug: string): Promise<WPPost | null> {
  const { data } = await wpFetch<WPPost[]>(`/posts?slug=${slug}&_embed=1`);
  return data[0] ?? null;
}

export async function getCategories(): Promise<WPCategory[]> {
  const { data } = await wpFetch<WPCategory[]>("/categories?per_page=100&hide_empty=true");
  return data;
}

export async function getCategoryBySlug(slug: string): Promise<WPCategory | null> {
  const { data } = await wpFetch<WPCategory[]>(`/categories?slug=${slug}`);
  return data[0] ?? null;
}

export async function getTags(): Promise<WPTag[]> {
  const { data } = await wpFetch<WPTag[]>("/tags?per_page=100&hide_empty=true");
  return data;
}

export async function getTagBySlug(slug: string): Promise<WPTag | null> {
  const { data } = await wpFetch<WPTag[]>(`/tags?slug=${slug}`);
  return data[0] ?? null;
}
