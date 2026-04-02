import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getIP } from "@/lib/rate-limit";
import { incrementViewCount, getViewCount } from "@/lib/supabase/views";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const id = Number(postId);
  if (!id) return NextResponse.json({ error: "Invalid postId" }, { status: 400 });

  // 같은 IP는 1시간에 1번만 카운트
  const { success } = rateLimit(`view:${getIP(req)}:${id}`, { limit: 1, windowMs: 60 * 60_000 });
  if (!success) {
    const count = await getViewCount(id);
    return NextResponse.json({ count });
  }

  const count = await incrementViewCount(id);
  return NextResponse.json({ count });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const id = Number(postId);
  if (!id) return NextResponse.json({ error: "Invalid postId" }, { status: 400 });

  const count = await getViewCount(id);
  return NextResponse.json({ count });
}
