import { NextResponse } from "next/server";

import type { ChatPublicError } from "@/lib/chat/errors";

export type ApiError = {
  code: string;
  message: string;
  userMessage?: string;
  retryable?: boolean;
  action?: string | null;
  requestId?: string;
  metadata?: Record<string, string | number | boolean | null>;
  fieldErrors?: Record<string, string[]>;
};

export function jsonData<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function jsonError(error: ApiError, status = 400) {
  return NextResponse.json({ error }, { status });
}

export function jsonChatError(error: ChatPublicError, status = 400) {
  return NextResponse.json(
    { error: { ...error, message: error.userMessage } },
    { status, headers: error.requestId ? { "X-Request-Id": error.requestId } : undefined },
  );
}
