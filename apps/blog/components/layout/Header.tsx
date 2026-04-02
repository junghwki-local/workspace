import Link from "next/link";
import { auth } from "@/auth";
import { getCategories } from "@/lib/wordpress/api";
import SearchBar from "@/components/ui/SearchBar";

export default async function Header() {
  const [categories, session] = await Promise.all([
    getCategories().catch(() => []),
    auth(),
  ]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 mix-blend-difference">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between">
        <Link
          href="/blog"
          className="text-white font-bold text-lg tracking-tight hover:opacity-70 transition-opacity"
        >
          ✦ BLOG
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/blog" className="text-white text-sm hover:underline underline-offset-4 decoration-1">
            ALL
          </Link>
          {categories.slice(0, 5).map((cat) => (
            <Link
              key={cat.id}
              href={`/blog?category=${cat.slug}`}
              className="text-white text-sm hover:underline underline-offset-4 decoration-1 transition-all"
            >
              {cat.name.toUpperCase()}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {session && (
            <Link
              href="/write"
              className="text-white text-sm px-3 py-1 border border-white/40 hover:border-white transition-colors"
            >
              + 글쓰기
            </Link>
          )}
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
