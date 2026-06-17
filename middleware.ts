import { NextResponse, type NextRequest } from 'next/server';
const protectedRoutes=['/home','/perfil','/planes','/libro'];
export function middleware(req:NextRequest){const demo=process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';const isProtected=protectedRoutes.some((p)=>req.nextUrl.pathname.startsWith(p));if(isProtected&&!demo){const hasSession=req.cookies.has('sb-access-token')||req.cookies.has('ceoteca-session');if(!hasSession){const url=req.nextUrl.clone();url.pathname='/login';url.searchParams.set('next',req.nextUrl.pathname);return NextResponse.redirect(url);}}return NextResponse.next();}
export const config={matcher:['/home/:path*','/perfil/:path*','/planes/:path*','/libro/:path*']};
