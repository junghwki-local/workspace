"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import SearchBar from "@/components/ui/SearchBar";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function HeaderActions() {
  const { data: session } = useSession();

  return (
    <div className="flex items-center gap-3">
      {session && (
        <>
          <Link
            href="/drafts"
            className="text-white text-sm hover:opacity-70 transition-opacity"
          >
            임시저장
          </Link>
          <Link
            href="/write"
            className="text-white text-sm px-3 py-1 border border-white/40 hover:border-white transition-colors"
          >
            + 글쓰기
          </Link>
        </>
      )}
      <SearchBar />
      <ThemeToggle />
    </div>
  );
}
