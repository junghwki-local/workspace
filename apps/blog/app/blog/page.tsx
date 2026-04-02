import { Suspense } from "react";
import type { Metadata } from "next";
import { getPosts, getCategoryBySlug } from "@/lib/wordpress/api";
import FeaturedSection from "@/components/blog/FeaturedSection";
import PostGrid from "@/components/blog/PostGrid";
import Pagination from "@/components/ui/Pagination";
import PageTransition from "@/components/animations/PageTransition";


export const metadata: Metadata = {
  title: "Blog",
  description: "모든 글을 한 곳에서",
};

interface BlogPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    category?: string;
    tag?: string;
  }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const currentPage = Number(params.page ?? 1);
  const search = params.search?.trim();
  const categorySlug = params.category;

  const categoryData = categorySlug
    ? await getCategoryBySlug(categorySlug).catch(() => null)
    : null;

  const { posts, totalPages } = await getPosts({
    page: currentPage,
    perPage: 9,
    search,
    categories: categoryData?.id,
  }).catch(() => ({ posts: [], totalPages: 1, total: 0 }));

  const [featured, ...rest] = posts;

  const searchParamsForPagination: Record<string, string> = {};
  if (search) searchParamsForPagination.search = search;
  if (categorySlug) searchParamsForPagination.category = categorySlug;

  return (
    <PageTransition>
      <div className="pt-20 min-h-screen">
        {/* 헤더 섹션 */}
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-10 md:py-16">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">
            {categoryData?.name ?? search ? `"${search}" 검색 결과` : "All Posts"}
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
            {categoryData?.name ?? (search ? search : "Blog")}
          </h1>
          {categoryData && (
            <p className="text-sm text-zinc-500 mt-2">{categoryData.count}개의 글</p>
          )}
        </div>

        {/* 피처드 포스트 (junghwan.kim/board 스타일) */}
        {featured && !search && (
          <div className="w-full mb-12 md:mb-20">
            <FeaturedSection
              post={featured}
              categoryName={categoryData?.name}
              categorySlug={categoryData?.slug}
            />
          </div>
        )}

        {/* 글 그리드 */}
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 pb-16">
          <Suspense fallback={<div className="py-12 text-center text-zinc-500 text-sm">불러오는 중...</div>}>
            <PostGrid posts={search ? posts : rest} />
          </Suspense>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/blog"
            searchParams={searchParamsForPagination}
          />
        </div>
      </div>
    </PageTransition>
  );
}
