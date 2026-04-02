import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string>;
}

function buildHref(basePath: string, page: number, searchParams: Record<string, string> = {}): string {
  const params = new URLSearchParams({ ...searchParams, page: String(page) });
  return `${basePath}?${params}`;
}

export default function Pagination({ currentPage, totalPages, basePath, searchParams }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="페이지네이션" className="flex items-center justify-center gap-2 mt-16">
      {currentPage > 1 && (
        <Link
          href={buildHref(basePath, currentPage - 1, searchParams)}
          className="px-3 py-1.5 text-sm text-zinc-500 hover:text-white transition-colors"
        >
          ← PREV
        </Link>
      )}
      <div className="flex items-center gap-1">
        {pages.map((page) => (
          <Link
            key={page}
            href={buildHref(basePath, page, searchParams)}
            aria-current={page === currentPage ? "page" : undefined}
            className={`w-8 h-8 flex items-center justify-center text-sm transition-colors ${
              page === currentPage
                ? "bg-white text-black font-semibold"
                : "text-zinc-500 hover:text-white"
            }`}
          >
            {page}
          </Link>
        ))}
      </div>
      {currentPage < totalPages && (
        <Link
          href={buildHref(basePath, currentPage + 1, searchParams)}
          className="px-3 py-1.5 text-sm text-zinc-500 hover:text-white transition-colors"
        >
          NEXT →
        </Link>
      )}
    </nav>
  );
}
