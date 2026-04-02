export default function BlogLoading() {
  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <div className="h-3 w-24 bg-zinc-800 rounded mb-4 animate-pulse" />
        <div className="h-14 w-48 bg-zinc-800 rounded animate-pulse" />
      </div>
      <div className="w-full h-[60vh] bg-zinc-900 animate-pulse mb-12 md:mb-20" />
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 rounded animate-pulse">
              <div className="aspect-[16/9] bg-zinc-800" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-16 bg-zinc-800 rounded" />
                <div className="h-5 w-full bg-zinc-800 rounded" />
                <div className="h-4 w-3/4 bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
