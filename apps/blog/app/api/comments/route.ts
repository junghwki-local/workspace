import { NextRequest, NextResponse } from "next/server";
import { addComment } from "@/lib/supabase/comments";
import { z } from "zod";
import { createHash } from "crypto";

const AddCommentSchema = z.object({
  postId: z.number().int().positive(),
  author: z.string().min(1).max(50).trim(),
  content: z.string().min(1).max(1000).trim(),
  password: z.string().min(4).max(100),
});

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function POST(req: NextRequest) {
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
    passwordHash: hashPassword(password),
  });

  return NextResponse.json(comment, { status: 201 });
}
