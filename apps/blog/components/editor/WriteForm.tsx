"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import nextDynamic from "next/dynamic";

const TiptapEditor = nextDynamic(() => import("./TiptapEditor"), { ssr: false });

export default function WriteForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "publish">("draft");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, status }),
      });

      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error);
      }

      const post = await res.json() as { slug: string };
      router.push(`/post/${post.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 제목 */}
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          className="w-full bg-transparent text-3xl font-bold placeholder:text-zinc-700 border-b border-zinc-800 pb-3 focus:outline-none focus:border-white transition-colors"
        />
      </div>

      {/* 에디터 */}
      <TiptapEditor content={content} onChange={setContent} />

      {error && (
        <p className="text-sm text-red-500" role="alert">{error}</p>
      )}

      {/* 하단 액션 */}
      <div className="flex items-center gap-4 pt-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "draft" | "publish")}
          className="bg-zinc-900 border border-zinc-800 text-sm px-3 py-2 focus:outline-none focus:border-zinc-600 transition-colors"
        >
          <option value="draft">임시저장</option>
          <option value="publish">발행</option>
        </select>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-white text-black text-sm font-semibold hover:opacity-80 disabled:opacity-30 transition-opacity"
        >
          {isSubmitting ? "저장 중..." : status === "publish" ? "발행하기" : "임시저장"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/blog")}
          className="text-sm text-zinc-500 hover:text-white transition-colors"
        >
          취소
        </button>
      </div>
    </form>
  );
}
