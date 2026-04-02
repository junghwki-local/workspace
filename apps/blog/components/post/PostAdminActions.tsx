"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface PostAdminActionsProps {
  postId: number;
}

export default function PostAdminActions({ postId }: PostAdminActionsProps) {
  const { data: session } = useSession();
  const t = useTranslations("write");
  if (!session) return null;

  return (
    <div className="flex items-center gap-3 mb-6">
      <Link
        href={`/edit/${postId}`}
        className="text-xs text-zinc-500 border border-zinc-200 dark:border-zinc-800 px-3 py-1 hover:text-current hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
      >
        ✎ {t("editTitle")}
      </Link>
    </div>
  );
}
