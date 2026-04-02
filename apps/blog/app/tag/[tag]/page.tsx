import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPosts, getTagBySlug } from "@/lib/wordpress/api";
import PostGrid from "@/components/blog/PostGrid";
import Pagination from "@/components/ui/Pagination";
import PageTransition from "@/components/animations/PageTransition";


interface TagPageProps {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  const tagData = await getTagBySlug(tag).catch(() => null);
  if (!tagData) return { title: "Not Found" };
  return { title: `#${tagData.name}` };
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { tag } = await params;
  const { page } = await searchParams;
  const currentPage = Number(page ?? 1);

  const tagData = await getTagBySlug(tag).catch(() => null);
  if (!tagData) notFound();

  const { posts, totalPages } = await getPosts({
    page: currentPage,
    perPage: 9,
    tags: tagData.id,
  }).catch(() => ({ posts: [], totalPages: 1, total: 0 }));

  return (
    <PageTransition>
      <div className="pt-20 min-h-screen">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-10 md:py-16">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Tag</p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
            #{tagData.name}
          </h1>
          <p className="text-sm text-zinc-500 mt-2">{tagData.count}개의 글</p>
        </div>

        <div className="max-w-screen-xl mx-auto px-4 md:px-8 pb-16">
          <PostGrid posts={posts} />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={`/tag/${tag}`}
          />
        </div>
      </div>
    </PageTransition>
  );
}
