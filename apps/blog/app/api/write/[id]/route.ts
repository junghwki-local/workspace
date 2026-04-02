import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
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

  const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL;
  const wpUser = process.env.WP_USER;
  const wpAppPassword = process.env.WP_APP_PASSWORD;
  if (!wpUrl || !wpUser || !wpAppPassword) {
    return NextResponse.json({ error: "WordPress 설정 누락" }, { status: 500 });
  }

  const credentials = Buffer.from(`${wpUser}:${wpAppPassword}`).toString("base64");

  const res = await fetch(`${wpUrl}/wp-json/wp/v2/posts/${id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify(parsed.data),
  });

  if (!res.ok) {
    const err = await res.json() as { message?: string };
    return NextResponse.json({ error: err.message ?? "수정 실패" }, { status: res.status });
  }

  const post = await res.json() as { slug: string; id: number };
  revalidateTag("posts", "max");
  revalidateTag(`post-${post.slug}`, "max");

  return NextResponse.json({ slug: post.slug, id: post.id });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL;
  const wpUser = process.env.WP_USER;
  const wpAppPassword = process.env.WP_APP_PASSWORD;
  if (!wpUrl || !wpUser || !wpAppPassword) {
    return NextResponse.json({ error: "WordPress 설정 누락" }, { status: 500 });
  }

  const credentials = Buffer.from(`${wpUser}:${wpAppPassword}`).toString("base64");

  const res = await fetch(`${wpUrl}/wp-json/wp/v2/posts/${id}?force=true`, {
    method: "DELETE",
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (!res.ok) {
    const err = await res.json() as { message?: string };
    return NextResponse.json({ error: err.message ?? "삭제 실패" }, { status: res.status });
  }

  revalidateTag("posts", "max");

  return new NextResponse(null, { status: 204 });
}
