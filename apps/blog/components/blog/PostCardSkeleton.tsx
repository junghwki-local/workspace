import Skeleton from "@/components/ui/Skeleton";

export default function PostCardSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* 썸네일 */}
      <Skeleton className="w-full aspect-[16/9] rounded-none" />
      <div className="p-4 sm:p-5">
        {/* 카테고리 + 날짜 */}
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-20 ml-auto" />
        </div>
        {/* 제목 */}
        <Skeleton className="h-5 w-full mb-1.5" />
        <Skeleton className="h-5 w-3/4 mb-3" />
        {/* 본문 */}
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}
