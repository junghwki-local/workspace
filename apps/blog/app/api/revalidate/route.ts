import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

const Schema = z.object({ tag: z.string().default("posts") });

export async function POST(request: Request) {
  const secret = request.headers.get("x-revalidate-secret");

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const body: unknown = await request.json();
  const { tag } = Schema.catch({ tag: "posts" }).parse(body);

  revalidateTag(tag, "max");

  return NextResponse.json({ revalidated: true, tag });
}
