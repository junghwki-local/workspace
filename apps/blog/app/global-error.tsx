"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Error</p>
          <h1 className="text-3xl font-bold text-white mb-2">예상치 못한 오류가 발생했습니다</h1>
          <p className="text-zinc-400 text-sm mb-8">페이지를 새로고침하거나 잠시 후 다시 시도해주세요.</p>
          <button
            onClick={reset}
            className="text-sm text-white border border-zinc-700 px-6 py-2 hover:border-zinc-400 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
