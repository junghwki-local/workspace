"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { useEffect } from "react";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (!debouncedQuery.trim()) return;
    startTransition(() => {
      router.push(`/blog?search=${encodeURIComponent(debouncedQuery)}`);
    });
  }, [debouncedQuery, router]);

  return (
    <div className="flex items-center gap-2">
      {open && (
        <input
          autoFocus
          type="search"
          role="searchbox"
          aria-label="블로그 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              setQuery("");
            }
          }}
          placeholder="검색..."
          className="bg-transparent border-b border-white text-white text-sm placeholder:text-zinc-500 focus:outline-none w-36 md:w-48 pb-1"
        />
      )}
      <button
        aria-label={open ? "검색 닫기" : "검색 열기"}
        onClick={() => {
          setOpen((v) => !v);
          if (open) setQuery("");
        }}
        className="text-white text-sm hover:opacity-70 transition-opacity"
      >
        {open ? "✕" : "검색"}
      </button>
    </div>
  );
}
