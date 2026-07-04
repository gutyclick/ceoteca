import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import type { ZodError } from "zod";

import { clientEnv } from "@/lib/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

export function getAuthFieldErrors(error: ZodError) {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened).filter(
      (entry): entry is [string, string[]] => Array.isArray(entry[1]),
    ),
  );
}

export function getRequestIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function getRequestUserAgent(request: NextRequest) {
  return request.headers.get("user-agent") ?? "unknown";
}

export function checkAuthRateLimit({
  key,
  maxAttempts,
  windowMs,
}: {
  key: string;
  maxAttempts: number;
  windowMs: number;
}) {
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { limited: false };
  }

  if (current.count >= maxAttempts) {
    return {
      limited: true,
      retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  current.count += 1;
  rateLimitStore.set(key, current);
  return { limited: false };
}

export function createAnonSupabaseClient() {
  if (
    !clientEnv.NEXT_PUBLIC_SUPABASE_URL ||
    !clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error("Supabase no está configurado.");
  }

  return createClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

export async function logAuthEvent(input: {
  userId?: string | null;
  email?: string | null;
  eventType: Database["public"]["Tables"]["auth_events"]["Insert"]["event_type"];
  provider?: string;
  code?: string | null;
  message?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Json;
}) {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    return;
  }

  try {
    const supabase = createServiceSupabaseClient();
    await supabase.from("auth_events").insert({
      user_id: input.userId ?? null,
      email: input.email ?? null,
      event_type: input.eventType,
      provider: input.provider ?? "email",
      code: input.code ?? null,
      message: input.message ?? null,
      ip: input.ip ?? null,
      user_agent: input.userAgent ?? null,
      metadata: input.metadata ?? {},
    });
  } catch {
    // Auth logs should never block user-facing auth flows.
  }
}
