import Link from "next/link";
import Image from "next/image";
import type { WPPost } from "@/lib/wordpress/types";
import { formatDate, getCategoryColor, stripHtml } from "@/lib/utils";

interface FeaturedSectionProps {
  post: WPPost;
  categoryName?: string;
  categorySlug?: string;
}

export default function FeaturedSection({ post, categoryName, categorySlug }: FeaturedSectionProps) {
  const featuredImage = post._embedded?.["wp:featuredmedia"]?.[0];
  const categories = post._embedded?.["wp:term"]?.[0] ?? [];
  const primaryCategory = categorySlug
    ? { slug: categorySlug, name: categoryName ?? "" }
    : (categories[0] ?? { slug: "", name: "" });
  const colorClass = getCategoryColor(primaryCategory.slug, primaryCategory.name);

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-[60vh] lg:min-h-[80vh]">
      {/* 왼쪽: 스티키 이미지 */}
      <div className="relative w-full lg:w-1/2 h-64 sm:h-80 lg:h-auto lg:sticky lg:top-0 lg:self-start overflow-hidden">
        <div className="absolute inset-0 bg-black/30 z-10" />
        {featuredImage ? (
          <Image
            src={featuredImage.source_url}
            alt={featuredImage.alt_text || stripHtml(post.title.rendered)}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className={`w-full h-full ${colorClass}`} />
        )}
        {/* 카테고리 라벨 */}
        {primaryCategory.name && (
          <div className="absolute bottom-6 left-6 z-20">
            <span className={`text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 ${colorClass}`}>
              {primaryCategory.name}
            </span>
          </div>
        )}
      </div>

      {/* 오른쪽: 글 정보 */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 md:px-10 lg:px-16 py-12 bg-neutral-50">
        <time className="text-xs text-gray-400 mb-4">{formatDate(post.date)}</time>
        <h2
          className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-gray-900 mb-6 line-clamp-3"
          dangerouslySetInnerHTML={{ __html: post.title.rendered }}
        />
        <p className="text-gray-500 text-base leading-relaxed mb-8 line-clamp-3">
          {stripHtml(post.excerpt.rendered)}
        </p>
        <Link
          href={`/post/${post.slug}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:gap-4 transition-all duration-300 group"
        >
          읽어보기
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>
    </div>
  );
}
