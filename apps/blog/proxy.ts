import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const isProtected =
    pathname.startsWith("/write") ||
    pathname.startsWith("/edit") ||
    pathname.startsWith("/drafts");

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
});

export const config = {
  matcher: ["/write/:path*", "/edit/:path*", "/drafts/:path*", "/drafts"],
};
