import { supabase } from "./client";

export async function getViewCount(postId: number): Promise<number> {
  const { data } = await supabase
    .from("post_views")
    .select("count")
    .eq("post_id", postId)
    .single();
  return (data as { count: number } | null)?.count ?? 0;
}

export async function incrementViewCount(postId: number): Promise<number> {
  const { data } = await supabase.rpc("increment_view", { pid: postId });
  return (data as number) ?? 0;
}
