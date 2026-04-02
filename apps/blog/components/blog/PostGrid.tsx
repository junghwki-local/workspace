import type { WPPost } from "@/lib/wordpress/types";
import PostCard from "./PostCard";

interface PostGridProps {
  posts: WPPost[];
}

export default function PostGrid({ posts }: PostGridProps) {
  if (posts.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-zinc-500 text-sm">게시글이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
