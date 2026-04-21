"use client";

import { useState } from "react";
import { siteContent } from "@/content/placeholder";
import { cn } from "@/lib/utils";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { navLabels, brand } = siteContent.site;

  const closeMenu = () => setIsOpen(false);

  return (
    <header
      id="site-header"
      className="fixed top-0 right-0 left-0 z-50 transition-colors duration-300"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-10 md:py-6">
        <a href="#top" className="text-ink font-serif text-lg font-medium tracking-wide md:text-xl">
          {brand}
        </a>

        <nav aria-label="주 메뉴" className="hidden md:block">
          <ul className="text-ink-soft flex items-center gap-8 text-[13px] tracking-[0.12em]">
            {navLabels.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="hover:text-ink transition-colors">
                  {item.ko} <span className="text-ink-faint">({item.en})</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
          aria-label={isOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          onClick={() => setIsOpen((v) => !v)}
        >
          <span
            className={cn(
              "bg-ink h-px w-6 transition-transform duration-300",
              isOpen && "translate-y-[7px] rotate-45",
            )}
          />
          <span
            className={cn("bg-ink h-px w-6 transition-opacity duration-200", isOpen && "opacity-0")}
          />
          <span
            className={cn(
              "bg-ink h-px w-6 transition-transform duration-300",
              isOpen && "-translate-y-[7px] -rotate-45",
            )}
          />
        </button>
      </div>

      <div
        id="mobile-menu"
        className={cn(
          "bg-bg/95 overflow-hidden backdrop-blur-md transition-[max-height] duration-300 md:hidden",
          isOpen ? "max-h-96" : "max-h-0",
        )}
      >
        <nav aria-label="모바일 메뉴" className="px-5 pb-6">
          <ul className="text-ink-soft flex flex-col gap-4 text-sm">
            {navLabels.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} onClick={closeMenu} className="block py-2 tracking-[0.1em]">
                  {item.ko} <span className="text-ink-faint">({item.en})</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
