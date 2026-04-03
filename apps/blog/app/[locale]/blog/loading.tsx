import PostCardSkeleton from "@/components/blog/PostCardSkeleton";
import Skeleton from "@/components/ui/Skeleton";

export default function BlogLoading() {
  return (
    <div className="pt-20 min-h-screen">
      {/* 헤더 */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <Skeleton className="h-3 w-24 mb-3" />
        <Skeleton className="h-12 w-64 md:w-96" />
      </div>

      {/* 피처드 포스트 skeleton */}
      <div className="w-full mb-12 md:mb-20">
        <div className="relative w-full h-64 sm:h-80 md:h-[55vh]">
          <Skeleton className="w-full h-full rounded-none" />
        </div>
      </div>

      {/* 그리드 */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
