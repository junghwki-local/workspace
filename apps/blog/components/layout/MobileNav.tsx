"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import type { WPCategory } from "@/lib/wordpress/types";

interface MobileNavProps {
  categories: WPCategory[];
}

export default function MobileNav({ categories }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="md:hidden text-white p-1"
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4l12 12M16 4L4 16" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
        )}
      </button>

      {open && (
        <div
          className="md:hidden fixed inset-0 top-[60px] bg-black z-40 flex flex-col px-6 py-8 gap-6"
          onClick={() => setOpen(false)}
        >
          <Link href="/blog" className="text-white text-xl font-semibold">
            ALL
          </Link>
          {categories.slice(0, 5).map((cat) => (
            <Link
              key={cat.id}
              href={`/blog?category=${cat.slug}`}
              className="text-white text-xl font-semibold"
            >
              {cat.name.toUpperCase()}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
