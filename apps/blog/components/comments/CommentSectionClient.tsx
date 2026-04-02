"use client";

import dynamic from "next/dynamic";

const CommentSection = dynamic(() => import("./CommentSection"), { ssr: false });

export default function CommentSectionClient({ postId }: { postId: number }) {
  return <CommentSection postId={postId} />;
}
