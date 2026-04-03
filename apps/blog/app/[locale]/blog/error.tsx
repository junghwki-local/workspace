"use client";

import { useEffect } from "react";

export default function BlogError({
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
    <div className="pt-32 pb-16 min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 text-center">
        <p className="text-zinc-500 text-xs uppercase tracking-widest mb-3">Error</p>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
          글 목록을 불러올 수 없습니다
        </h2>
        <p className="text-zinc-500 text-sm mb-6">잠시 후 다시 시도해주세요.</p>
        <button
          onClick={reset}
          className="text-sm text-zinc-500 border border-zinc-300 dark:border-zinc-700 px-5 py-2 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
