import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { getCategories, getTags } from "@/lib/wordpress/api";
import WriteForm from "@/components/editor/WriteForm";

export const dynamic = "force-dynamic";

export default async function WritePage() {
  const session = await auth();
  if (!session) redirect("/login");

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
            <h1 className="text-3xl font-bold">새 글 작성</h1>
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

        <WriteForm categories={categories} tags={tags} />
      </div>
    </div>
  );
}
