import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  const secret = request.headers.get("x-revalidate-secret");

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const body = await request.json() as { tag?: string };
  const tag = body.tag ?? "posts";

  revalidateTag(tag, "max");

  return NextResponse.json({ revalidated: true, tag });
}
