"use client";

import { useState, useEffect, useRef } from "react";
import { Link } from "@/i18n/navigation";
import type { WPCategory } from "@/lib/wordpress/types";

interface MobileNavProps {
  categories: WPCategory[];
}

export default function MobileNav({ categories }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="md:hidden text-white p-1"
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open}
        aria-controls="mobile-nav-menu"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M4 4l12 12M16 4L4 16" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
        )}
      </button>

      {open && (
        <nav
          id="mobile-nav-menu"
          aria-label="모바일 내비게이션"
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
        </nav>
      )}
    </>
  );
}
