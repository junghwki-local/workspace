import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "이미지 파일만 업로드할 수 있습니다." }, { status: 400 });
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: "파일 크기는 10MB 이하여야 합니다." }, { status: 400 });
  }

  const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL;
  const wpUser = process.env.WP_USER;
  const wpAppPassword = process.env.WP_APP_PASSWORD;

  if (!wpUrl || !wpUser || !wpAppPassword) {
    return NextResponse.json({ error: "WordPress 설정 누락" }, { status: 500 });
  }

  const credentials = Buffer.from(`${wpUser}:${wpAppPassword}`).toString("base64");
  const bytes = await file.arrayBuffer();

  const res = await fetch(`${wpUrl}/wp-json/wp/v2/media`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Disposition": `attachment; filename="${file.name}"`,
      "Content-Type": file.type,
    },
    body: bytes,
  });

  if (!res.ok) {
    const err = await res.json() as { message?: string };
    return NextResponse.json(
      { error: err.message ?? "업로드 실패" },
      { status: res.status }
    );
  }

  const media = await res.json() as { source_url: string; id: number };
  return NextResponse.json({ url: media.source_url, id: media.id });
}
