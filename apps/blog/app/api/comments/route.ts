import { NextRequest, NextResponse } from "next/server";
import { addComment, hashPassword } from "@/lib/supabase/comments";
import { rateLimit, getIP } from "@/lib/rate-limit";
import { z } from "zod";

const AddCommentSchema = z.object({
  postId: z.number().int().positive(),
  author: z.string().min(1).max(50).trim(),
  content: z.string().min(1).max(1000).trim(),
  password: z.string().min(4).max(100),
});

export async function POST(req: NextRequest) {
  const { success } = rateLimit(`comment:${getIP(req)}`, { limit: 5, windowMs: 60_000 });
  if (!success) {
    return NextResponse.json({ error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const body: unknown = await req.json();
  const parsed = AddCommentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { postId, author, content, password } = parsed.data;

  const comment = await addComment({
    postId,
    author,
    content,
    passwordHash: await hashPassword(password),
  });

  return NextResponse.json(comment, { status: 201 });
}
