"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import nextDynamic from "next/dynamic";
import { toast } from "sonner";
import type { WPCategory, WPTag } from "@/lib/wordpress/types";

const TiptapEditor = nextDynamic(() => import("./TiptapEditor"), { ssr: false });

interface EditFormProps {
  postId: number;
  initialTitle: string;
  initialContent: string;
  initialStatus: "draft" | "publish";
  initialCategories: number[];
  initialTags: number[];
  categories: WPCategory[];
  tags: WPTag[];
}

export default function EditForm({
  postId,
  initialTitle,
  initialContent,
  initialStatus,
  initialCategories,
  initialTags,
  categories,
  tags,
}: EditFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState<"draft" | "publish">(initialStatus);
  const [selectedCategories, setSelectedCategories] = useState<number[]>(initialCategories);
  const [selectedTags, setSelectedTags] = useState<number[]>(initialTags);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  function toggleCategory(id: number) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function toggleTag(id: number) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/write/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          status,
          categories: selectedCategories,
          tags: selectedTags,
        }),
      });

      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error);
      }

      const { slug } = await res.json() as { slug: string };
      toast.success("글이 수정되었습니다.");
      router.push(`/post/${slug}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "오류가 발생했습니다.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirm("정말 이 글을 삭제하시겠습니까?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/write/${postId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error);
      }
      toast.success("글이 삭제되었습니다.");
      router.push("/blog");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "삭제 실패");
      setIsDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          className="w-full bg-transparent text-3xl font-bold placeholder:text-zinc-700 border-b border-zinc-800 pb-3 focus:outline-none focus:border-white transition-colors"
        />
      </div>

      <TiptapEditor content={content} onChange={setContent} />

      {categories.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">카테고리</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`px-3 py-1 text-xs border transition-colors ${
                  selectedCategories.includes(cat.id)
                    ? "border-white bg-white text-black"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {tags.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">태그</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1 text-xs border transition-colors ${
                  selectedTags.includes(tag.id)
                    ? "border-white bg-white text-black"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500" role="alert">{error}</p>}

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
          {isSubmitting ? "저장 중..." : "수정 저장"}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-zinc-500 hover:text-white transition-colors"
        >
          취소
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="ml-auto text-sm text-red-600 hover:text-red-400 disabled:opacity-30 transition-colors"
        >
          {isDeleting ? "삭제 중..." : "글 삭제"}
        </button>
      </div>
    </form>
  );
}
