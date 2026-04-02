"use client";

import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import SearchBar from "@/components/ui/SearchBar";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function HeaderActions() {
  const { data: session } = useSession();
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function toggleLocale() {
    router.replace(pathname, { locale: locale === "ko" ? "en" : "ko" });
  }

  return (
    <div className="flex items-center gap-3">
      {session && (
        <>
          <Link
            href="/drafts"
            className="text-current text-sm opacity-60 hover:opacity-100 transition-opacity"
          >
            {t("drafts")}
          </Link>
          <Link
            href="/write"
            className="text-current text-sm px-3 py-1 border border-current/40 hover:border-current/80 transition-colors"
          >
            {t("write")}
          </Link>
        </>
      )}
      <SearchBar />
      <button
        onClick={toggleLocale}
        className="text-current text-xs opacity-60 hover:opacity-100 transition-opacity font-medium"
        aria-label="언어 전환"
      >
        {locale === "ko" ? "EN" : "KO"}
      </button>
      <ThemeToggle />
    </div>
  );
}
