import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { getCategories, getTags } from "@/lib/wordpress/api";
import EditForm from "@/components/editor/EditForm";

export const dynamic = "force-dynamic";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPage({ params }: EditPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const postId = Number(id);
  if (!postId) redirect("/blog");

  const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL;
  const wpUser = process.env.WP_USER;
  const wpAppPassword = process.env.WP_APP_PASSWORD;

  if (!wpUrl || !wpUser || !wpAppPassword) redirect("/blog");

  const credentials = Buffer.from(`${wpUser}:${wpAppPassword}`).toString("base64");
  const res = await fetch(`${wpUrl}/wp-json/wp/v2/posts/${postId}?context=edit`, {
    headers: { Authorization: `Basic ${credentials}` },
    cache: "no-store",
  });
  if (!res.ok) redirect("/blog");

  const post = await res.json() as {
    id: number;
    slug: string;
    title: { raw: string };
    content: { raw: string };
    status: string;
    categories: number[];
    tags: number[];
  };

  const [categories, tags] = await Promise.all([
    getCategories().catch(() => []),
    getTags().catch(() => []),
  ]);

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Admin</p>
            <h1 className="text-3xl font-bold">글 수정</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-600">{session.user?.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/blog" });
              }}
            >
              <button type="submit" className="text-xs text-zinc-500 hover:text-white transition-colors">
                로그아웃
              </button>
            </form>
          </div>
        </div>

        <EditForm
          postId={post.id}
          initialTitle={post.title.raw}
          initialContent={post.content.raw}
          initialStatus={post.status === "publish" ? "publish" : "draft"}
          initialCategories={post.categories}
          initialTags={post.tags}
          categories={categories}
          tags={tags}
        />
      </div>
    </div>
  );
}
