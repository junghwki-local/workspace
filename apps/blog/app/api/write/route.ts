import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { wpAdminFetch, WPAdminError } from "@/lib/wordpress/admin";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  status: z.enum(["draft", "publish"]),
  categories: z.array(z.number()).optional().default([]),
  tags: z.array(z.number()).optional().default([]),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "유효하지 않은 입력입니다." }, { status: 400 });
  }

  try {
    const post = await wpAdminFetch<{ slug: string; id: number }>("/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    if (parsed.data.status === "publish") {
      revalidateTag("posts", "max");
      revalidateTag("categories", "max");
    }

    return NextResponse.json({ slug: post.slug, id: post.id });
  } catch (err) {
    if (err instanceof WPAdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "오류가 발생했습니다." }, { status: 500 });
  }
}
