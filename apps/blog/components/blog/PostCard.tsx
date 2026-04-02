import { Link } from "@/i18n/navigation";
import Image from "next/image";
import type { WPPost } from "@/lib/wordpress/types";
import { formatDate, getCategoryColor, stripHtml } from "@/lib/utils";

interface PostCardProps {
  post: WPPost;
}

export default function PostCard({ post }: PostCardProps) {
  const featuredImage = post._embedded?.["wp:featuredmedia"]?.[0];
  const categories = post._embedded?.["wp:term"]?.[0] ?? [];
  const primaryCategory = categories[0];
  const colorClass = primaryCategory
    ? getCategoryColor(primaryCategory.slug, primaryCategory.name)
    : "bg-zinc-700";
  const excerpt = stripHtml(post.excerpt.rendered).slice(0, 80);

  return (
    <article className="gs-fade-up group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      <Link href={`/post/${post.slug}`} className="block">
        <div className="relative w-full aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          {featuredImage ? (
            <Image
              src={featuredImage.source_url}
              alt={featuredImage.alt_text || stripHtml(post.title.rendered)}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className={`w-full h-full ${colorClass} opacity-20`} />
          )}
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {categories.slice(0, 2).map((cat) => (
              <span
                key={cat.id}
                className={`text-xs font-semibold text-white px-2 py-0.5 ${getCategoryColor(cat.slug, cat.name)}`}
              >
                {cat.name}
              </span>
            ))}
            <time className="text-xs text-zinc-400 ml-auto">{formatDate(post.date)}</time>
          </div>

          <h2
            className="text-base sm:text-lg font-bold leading-snug mb-1.5 text-zinc-900 dark:text-white line-clamp-2"
            dangerouslySetInnerHTML={{ __html: post.title.rendered }}
          />

          <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">{excerpt}</p>
        </div>
      </Link>
    </article>
  );
}
