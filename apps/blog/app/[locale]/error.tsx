"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/navigation";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Error</p>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
          오류가 발생했습니다
        </h1>
        <p className="text-zinc-500 text-sm mb-8">
          페이지를 불러오는 중 문제가 생겼습니다.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="text-sm text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 px-5 py-2 hover:opacity-80 transition-opacity"
          >
            다시 시도
          </button>
          <Link
            href="/blog"
            className="text-sm text-zinc-500 border border-zinc-300 dark:border-zinc-700 px-5 py-2 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            목록으로
          </Link>
        </div>
      </div>
    </div>
  );
}
