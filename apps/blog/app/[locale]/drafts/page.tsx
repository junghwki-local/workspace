import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { wpAdminFetch } from "@/lib/wordpress/admin";
import { formatDate, stripHtml } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface WPDraft {
  id: number;
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  date: string;
  modified: string;
}

export default async function DraftsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [t, tAuth] = await Promise.all([
    getTranslations("drafts"),
    getTranslations("auth"),
  ]);

  const drafts = await wpAdminFetch<WPDraft[]>(
    "/posts?status=draft&per_page=50&orderby=modified&order=desc"
  ).catch(() => []);

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{tAuth("admin")}</p>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
          </div>
          <Link
            href="/write"
            className="text-sm text-zinc-400 border border-zinc-300 dark:border-zinc-700 px-4 py-2 hover:text-current hover:border-zinc-500 transition-colors"
          >
            {t("newPost") /* Actually write.newPost */}
          </Link>
        </div>

        {drafts.length === 0 ? (
          <p className="text-zinc-500 text-sm">{t("empty")}</p>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {drafts.map((draft) => (
              <div key={draft.id} className="py-5 flex items-start justify-between gap-4 group">
                <div className="min-w-0">
                  <h2 className="font-semibold leading-snug truncate">
                    {stripHtml(draft.title.rendered) || t("noTitle")}
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                    {stripHtml(draft.excerpt.rendered)}
                  </p>
                  <time className="text-xs text-zinc-400 mt-1 block">
                    {t("lastModified", { date: formatDate(draft.modified) })}
                  </time>
                </div>
                <Link
                  href={`/edit/${draft.id}`}
                  className="shrink-0 text-xs text-zinc-500 border border-zinc-200 dark:border-zinc-800 px-3 py-1 hover:text-current hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
                >
                  {t("edit")}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
