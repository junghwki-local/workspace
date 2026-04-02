import createMiddleware from "next-intl/middleware";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import type { NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);

// next-auth의 auth 미들웨어와 next-intl 미들웨어를 체이닝
export default auth((req: NextRequest & { auth?: unknown }) => {
  const { pathname } = req.nextUrl;

  // 보호된 경로 체크 (locale prefix 제거 후)
  const strippedPath = pathname.replace(/^\/(en|ko)/, "") || "/";
  const isProtected =
    strippedPath.startsWith("/write") ||
    strippedPath.startsWith("/edit") ||
    strippedPath.startsWith("/drafts");

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
