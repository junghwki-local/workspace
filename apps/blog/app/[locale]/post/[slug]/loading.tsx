import Skeleton from "@/components/ui/Skeleton";

export default function PostLoading() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      {/* 헤더 */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 mb-10 md:mb-16">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-24 ml-2" />
          </div>
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-4/5 mb-2" />
          <Skeleton className="h-10 w-3/5" />
        </div>
      </div>

      {/* 썸네일 */}
      <Skeleton className="w-full h-64 sm:h-80 md:h-[60vh] mb-12 md:mb-20 rounded-none" />

      {/* 본문 */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        <div className="max-w-3xl mx-auto space-y-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className={`h-4 ${i % 4 === 3 ? "w-2/3" : "w-full"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
