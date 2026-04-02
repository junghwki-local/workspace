import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { wpAdminFetch } from "@/lib/wordpress/admin";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

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
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "이미지 파일만 업로드할 수 있습니다." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "파일 크기는 10MB 이하여야 합니다." }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const media = await wpAdminFetch<{ source_url: string; id: number }>("/media", {
      method: "POST",
      headers: {
        "Content-Disposition": `attachment; filename="${file.name}"`,
        "Content-Type": file.type,
      },
      body: bytes,
    });

    return NextResponse.json({ url: media.source_url, id: media.id });
  } catch (err) {
    const e = err as { message?: string; status?: number };
    return NextResponse.json({ error: e.message ?? "업로드 실패" }, { status: e.status ?? 500 });
  }
}
