"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

interface PostAdminActionsProps {
  postId: number;
}

export default function PostAdminActions({ postId }: PostAdminActionsProps) {
  const { data: session } = useSession();
  if (!session) return null;

  return (
    <div className="flex items-center gap-3 mb-6">
      <Link
        href={`/edit/${postId}`}
        className="text-xs text-zinc-500 border border-zinc-800 px-3 py-1 hover:text-white hover:border-zinc-600 transition-colors"
      >
        ✎ 수정
      </Link>
    </div>
  );
}
