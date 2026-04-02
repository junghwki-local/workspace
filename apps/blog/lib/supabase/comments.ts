import { createHash } from "crypto";
import { supabase } from "./client";
import type { Comment } from "./types";

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function getComments(postId: number): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("id, post_id, author, content, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Comment[];
}

export async function addComment({
  postId,
  author,
  content,
  passwordHash,
}: {
  postId: number;
  author: string;
  content: string;
  passwordHash: string;
}): Promise<Comment> {
  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author, content, password_hash: passwordHash })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Comment;
}

export async function deleteComment({
  id,
  passwordHash,
}: {
  id: string;
  passwordHash: string;
}): Promise<void> {
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", id)
    .eq("password_hash", passwordHash);

  if (error) throw new Error(error.message);
}
