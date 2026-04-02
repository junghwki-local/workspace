import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { WPPost } from "@/lib/wordpress/types";
import { formatDate, getCategoryColor, stripHtml } from "@/lib/utils";

interface FeaturedSectionProps {
  post: WPPost;
  categoryName?: string;
  categorySlug?: string;
}

export default async function FeaturedSection({ post, categoryName, categorySlug }: FeaturedSectionProps) {
  const t = await getTranslations("blog");
  const featuredImage = post._embedded?.["wp:featuredmedia"]?.[0];
  const categories = post._embedded?.["wp:term"]?.[0] ?? [];
  const primaryCategory = categorySlug
    ? { slug: categorySlug, name: categoryName ?? "" }
    : (categories[0] ?? { slug: "", name: "" });
  const colorClass = getCategoryColor(primaryCategory.slug, primaryCategory.name);

  return (
    <Link href={`/post/${post.slug}`} className="block w-full group">
      <div className="relative w-full min-h-[60vw] sm:min-h-[50vw] lg:min-h-0 lg:flex lg:h-[80vh]">

        {/* 이미지 영역 */}
        <div className="relative w-full lg:w-1/2 h-64 sm:h-80 lg:h-full lg:sticky lg:top-0 overflow-hidden">
          <div className="absolute inset-0 bg-black/40 lg:bg-black/30 z-10" />
          {featuredImage ? (
            <Image
              src={featuredImage.source_url}
              alt={featuredImage.alt_text || stripHtml(post.title.rendered)}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              priority
            />
          ) : (
            <div className={`w-full h-full ${colorClass}`} />
          )}

          {/* 모바일 전용 오버레이 텍스트 */}
          <div className="absolute inset-0 z-20 flex flex-col justify-end p-5 lg:hidden">
            {primaryCategory.name && (
              <span className={`self-start text-xs font-bold uppercase tracking-widest text-white px-2 py-1 mb-3 ${colorClass}`}>
                {primaryCategory.name}
              </span>
            )}
            <time className="text-xs text-white/60 mb-2">{formatDate(post.date)}</time>
            <h2
              className="text-xl font-bold leading-tight text-white line-clamp-3"
              dangerouslySetInnerHTML={{ __html: post.title.rendered }}
            />
            <p className="text-sm text-white/70 mt-2 line-clamp-2">
              {stripHtml(post.excerpt.rendered)}
            </p>
          </div>
        </div>

        {/* 데스크탑 전용 오른쪽 패널 */}
        <div className="hidden lg:flex w-1/2 flex-col justify-center px-16 py-12 bg-zinc-50 dark:bg-zinc-950">
          {primaryCategory.name && (
            <span className={`self-start text-xs font-bold uppercase tracking-widest text-white px-2 py-1 mb-4 ${colorClass}`}>
              {primaryCategory.name}
            </span>
          )}
          <time className="text-xs text-zinc-400 mb-4">{formatDate(post.date)}</time>
          <h2
            className="text-5xl font-bold leading-tight text-zinc-900 dark:text-white mb-6 line-clamp-3"
            dangerouslySetInnerHTML={{ __html: post.title.rendered }}
          />
          <p className="text-zinc-500 dark:text-zinc-400 text-base leading-relaxed mb-8 line-clamp-3">
            {stripHtml(post.excerpt.rendered)}
          </p>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white group-hover:gap-4 transition-all duration-300">
            {t("readMore")}
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
