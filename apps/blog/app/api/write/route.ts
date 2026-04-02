import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  status: z.enum(["draft", "publish"]),
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

  const { title, content, status } = parsed.data;

  const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL;
  const wpUser = process.env.WP_USER;
  const wpAppPassword = process.env.WP_APP_PASSWORD;

  if (!wpUrl || !wpUser || !wpAppPassword) {
    return NextResponse.json({ error: "WordPress 설정이 누락됐습니다." }, { status: 500 });
  }

  const credentials = Buffer.from(`${wpUser}:${wpAppPassword}`).toString("base64");

  const res = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({ title, content, status }),
  });

  if (!res.ok) {
    const err = await res.json() as { message?: string };
    return NextResponse.json(
      { error: err.message ?? "WordPress 오류가 발생했습니다." },
      { status: res.status }
    );
  }

  const post = await res.json() as { slug: string; id: number };

  if (status === "publish") {
    revalidateTag("posts", "max");
    revalidateTag("categories", "max");
  }

  return NextResponse.json({ slug: post.slug, id: post.id });
}
