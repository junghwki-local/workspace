import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { getCategories, getTags } from "@/lib/wordpress/api";
import { getTranslations } from "next-intl/server";
import { wpAdminFetch } from "@/lib/wordpress/admin";
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

  const [t, tAuth] = await Promise.all([
    getTranslations("write"),
    getTranslations("auth"),
  ]);

  const post = await wpAdminFetch<{
    id: number;
    slug: string;
    title: { raw: string };
    content: { raw: string };
    status: string;
    categories: number[];
    tags: number[];
  }>(`/posts/${postId}?context=edit`).catch(() => null);

  if (!post) redirect("/blog");

  const [categories, tags] = await Promise.all([
    getCategories().catch(() => []),
    getTags().catch(() => []),
  ]);

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{tAuth("admin")}</p>
            <h1 className="text-3xl font-bold">{t("editTitle")}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-600">{session.user?.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/blog" });
              }}
            >
              <button type="submit" className="text-xs text-zinc-500 hover:text-current transition-colors">
                {tAuth("logout")}
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
