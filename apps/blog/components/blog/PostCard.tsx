import Link from "next/link";
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
  const excerpt = stripHtml(post.excerpt.rendered).slice(0, 100);

  return (
    <article className="gs-fade-up group relative bg-neutral-50 border border-gray-200 shadow-md hover:shadow-xl hover:-translate-y-3 transition-all duration-500 overflow-hidden">
      <Link href={`/post/${post.slug}`} className="block">
        {/* 썸네일 */}
        <div className="relative w-full aspect-[16/9] overflow-hidden bg-zinc-200">
          {featuredImage ? (
            <Image
              src={featuredImage.source_url}
              alt={featuredImage.alt_text || stripHtml(post.title.rendered)}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className={`w-full h-full ${colorClass} opacity-20`} />
          )}
        </div>

        {/* 콘텐츠 */}
        <div className="p-5">
          {/* 카테고리 배지 */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {categories.slice(0, 2).map((cat) => (
              <span
                key={cat.id}
                className={`text-xs font-semibold text-white px-2 py-0.5 ${getCategoryColor(cat.slug, cat.name)}`}
              >
                {cat.name}
              </span>
            ))}
            <time className="text-xs text-gray-400 ml-auto">{formatDate(post.date)}</time>
          </div>

          {/* 제목 */}
          <h2
            className="text-xl md:text-2xl font-bold leading-snug mb-2 text-gray-900 line-clamp-2"
            dangerouslySetInnerHTML={{ __html: post.title.rendered }}
          />

          {/* 요약 */}
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{excerpt}</p>
        </div>
      </Link>
    </article>
  );
}
