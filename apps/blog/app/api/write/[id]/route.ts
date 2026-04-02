import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { wpAdminFetch } from "@/lib/wordpress/admin";
import { z } from "zod";

const UpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  status: z.enum(["draft", "publish"]).optional(),
  categories: z.array(z.number()).optional(),
  tags: z.array(z.number()).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body: unknown = await request.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "유효하지 않은 입력입니다." }, { status: 400 });
  }

  try {
    const post = await wpAdminFetch<{ slug: string; id: number }>(`/posts/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    revalidateTag("posts", "max");
    revalidateTag(`post-${post.slug}`, "max");

    return NextResponse.json({ slug: post.slug, id: post.id });
  } catch (err) {
    const e = err as { message?: string; status?: number };
    return NextResponse.json({ error: e.message ?? "수정 실패" }, { status: e.status ?? 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await wpAdminFetch(`/posts/${id}?force=true`, { method: "DELETE" });
    revalidateTag("posts", "max");
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const e = err as { message?: string; status?: number };
    return NextResponse.json({ error: e.message ?? "삭제 실패" }, { status: e.status ?? 500 });
  }
}
