import Link from "next/link";
import Image from "next/image";
import { getPosts } from "@/lib/wordpress/api";
import { formatDate, stripHtml } from "@/lib/utils";

interface RelatedPostsProps {
  currentPostId: number;
  categoryId?: number;
}

export default async function RelatedPosts({ currentPostId, categoryId }: RelatedPostsProps) {
  if (!categoryId) return null;

  const { posts } = await getPosts({ categories: categoryId, perPage: 4 }).catch(() => ({
    posts: [],
    total: 0,
    totalPages: 0,
  }));

  const related = posts.filter((p) => p.id !== currentPostId).slice(0, 3);
  if (related.length === 0) return null;

  return (
    <section className="mt-16 pt-10 border-t border-zinc-800">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-6">관련 글</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {related.map((post) => {
          const image = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
          return (
            <Link
              key={post.id}
              href={`/post/${post.slug}`}
              className="group block"
            >
              {image && (
                <div className="relative aspect-video mb-3 overflow-hidden bg-zinc-900">
                  <Image
                    src={image}
                    alt={stripHtml(post.title.rendered)}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              <h3 className="text-sm font-semibold leading-snug group-hover:text-zinc-300 transition-colors line-clamp-2">
                {stripHtml(post.title.rendered)}
              </h3>
              <time className="text-xs text-zinc-600 mt-1 block">{formatDate(post.date)}</time>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
