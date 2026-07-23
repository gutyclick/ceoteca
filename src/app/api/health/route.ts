import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    { status: "ok", at: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export function HEAD() {
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
