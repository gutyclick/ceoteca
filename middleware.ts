import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/home", "/libro", "/perfil", "/planes"];

export function middleware(request: NextRequest) {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!isProtected || isDemoMode) {
    return NextResponse.next();
  }

  // Supabase auth currently runs in the browser client. Keep post-signup and
  // post-login navigation working until the SSR cookie refresh flow is added.
  if (process.env.NEXT_PUBLIC_REQUIRE_SERVER_AUTH !== "true") {
    return NextResponse.next();
  }

  const hasSupabaseSession = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-"));

  if (hasSupabaseSession) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/home/:path*", "/libro/:path*", "/perfil/:path*", "/planes/:path*"],
};
