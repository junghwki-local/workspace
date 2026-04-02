import { NextRequest, NextResponse } from "next/server";
import { deleteComment } from "@/lib/supabase/comments";
import { z } from "zod";
import { createHash } from "crypto";

const DeleteSchema = z.object({
  password: z.string().min(1),
});

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body: unknown = await req.json();
  const parsed = DeleteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "비밀번호를 입력해주세요." }, { status: 400 });
  }

  await deleteComment({ id, passwordHash: hashPassword(parsed.data.password) });

  return new NextResponse(null, { status: 204 });
}
