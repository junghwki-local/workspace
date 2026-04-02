import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
      <p className="text-xs text-zinc-600 uppercase tracking-widest">404</p>
      <h1 className="text-4xl font-bold">페이지를 찾을 수 없습니다</h1>
      <Link href="/blog" className="text-sm text-zinc-500 hover:text-white transition-colors">
        ← 블로그로 돌아가기
      </Link>
    </div>
  );
}
