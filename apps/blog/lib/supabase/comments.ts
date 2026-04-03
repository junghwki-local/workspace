import bcrypt from "bcryptjs";
import { supabase } from "./client";
import type { Comment } from "./types";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
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
  password,
}: {
  id: string;
  password: string;
}): Promise<void> {
  const { data, error: fetchError } = await supabase
    .from("comments")
    .select("password_hash")
    .eq("id", id)
    .single();

  if (fetchError || !data) throw new Error("댓글을 찾을 수 없습니다.");

  const match = await bcrypt.compare(password, (data as { password_hash: string }).password_hash);
  if (!match) throw new Error("비밀번호가 틀렸습니다.");

  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
