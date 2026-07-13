import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = [
  "/home",
  "/libro",
  "/perfil",
  "/chat",
  "/ejercicios",
  "/planes",
  "/admin",
];

export function middleware(request: NextRequest) {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (!isProtected || isDemoMode) {
    return NextResponse.next();
  }

  // Supabase browser auth stores the session in localStorage in this app.
  // The client PrivateRouteGuard performs the real route protection.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home/:path*",
    "/libro/:path*",
    "/perfil/:path*",
    "/chat/:path*",
    "/ejercicios/:path*",
    "/planes/:path*",
    "/configuracion/:path*",
    "/admin/:path*",
  ],
};
