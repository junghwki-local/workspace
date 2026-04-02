"use client";

import { useState, useTransition } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getComments } from "@/lib/supabase/comments";
import type { Comment } from "@/lib/supabase/types";
import { formatDate } from "@/lib/utils";

interface CommentSectionProps {
  postId: number;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const t = useTranslations("comments");
  const queryClient = useQueryClient();
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [, startTransition] = useTransition();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => getComments(postId),
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, author, content, password }),
      });
      if (!res.ok) {
        const err = await res.json() as { error: unknown };
        throw new Error(String(err.error));
      }
      return res.json() as Promise<Comment>;
    },
    onSuccess: () => {
      setAuthor("");
      setContent("");
      setPassword("");
      setFormError("");
      void queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      toast.success("댓글이 등록되었습니다.");
    },
    onError: (err: Error) => {
      setFormError(err.message);
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, pwd }: { id: string; pwd: string }) => {
      const res = await fetch(`/api/comments/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      if (!res.ok) throw new Error("비밀번호가 맞지 않습니다.");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      toast.success("댓글이 삭제되었습니다.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleDelete(id: string) {
    const pwd = prompt(t("deletePrompt"));
    if (!pwd) return;
    startTransition(() => {
      deleteMutation.mutate({ id, pwd });
    });
  }

  return (
    <section className="mt-16 pt-10 border-t border-zinc-200 dark:border-zinc-800" aria-label="댓글">
      <h2 className="text-xl font-bold mb-8">
        {t("title")} <span className="text-zinc-500 text-base font-normal">{comments.length}</span>
      </h2>

      {/* 댓글 목록 */}
      <div className="space-y-6 mb-12">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-3 w-24 bg-zinc-800 rounded mb-2" />
                <div className="h-4 w-full bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-zinc-600 text-sm">{t("empty")}</p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={() => handleDelete(comment.id)}
              deleteLabel={t("delete")}
            />
          ))
        )}
      </div>

      {/* 댓글 작성 폼 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addMutation.mutate();
        }}
        className="space-y-4"
      >
        <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">{t("write")}</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="comment-author" className="sr-only">이름</label>
            <input
              id="comment-author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder={t("namePlaceholder")}
              required
              maxLength={50}
              className="w-full bg-transparent border-b border-zinc-300 dark:border-zinc-700 pb-2 text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-colors"
            />
          </div>
          <div>
            <label htmlFor="comment-password" className="sr-only">비밀번호</label>
            <input
              id="comment-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("passwordPlaceholder")}
              required
              minLength={4}
              maxLength={100}
              className="w-full bg-transparent border-b border-zinc-300 dark:border-zinc-700 pb-2 text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-colors"
            />
          </div>
        </div>

        <div>
          <label htmlFor="comment-content" className="sr-only">내용</label>
          <textarea
            id="comment-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("contentPlaceholder")}
            required
            maxLength={1000}
            rows={4}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors resize-none"
          />
          <p className="text-xs text-zinc-700 text-right mt-1">{content.length}/1000</p>
        </div>

        {formError && (
          <p className="text-xs text-red-500" role="alert">{formError}</p>
        )}

        <button
          type="submit"
          disabled={addMutation.isPending}
          className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black text-sm font-semibold hover:opacity-80 disabled:opacity-30 transition-opacity"
        >
          {addMutation.isPending ? t("submitting") : t("submit")}
        </button>
      </form>
    </section>
  );
}

function CommentItem({ comment, onDelete, deleteLabel }: { comment: Comment; onDelete: () => void; deleteLabel: string }) {
  return (
    <div className="group border-b border-zinc-100 dark:border-zinc-900 pb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold">{comment.author}</span>
        <div className="flex items-center gap-4">
          <time className="text-xs text-zinc-600">{formatDate(comment.created_at)}</time>
          <button
            onClick={onDelete}
            className="text-xs text-zinc-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            aria-label={deleteLabel}
          >
            {deleteLabel}
          </button>
        </div>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
    </div>
  );
}
