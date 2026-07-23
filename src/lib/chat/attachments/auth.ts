import "server-only";

import type { NextRequest } from "next/server";

import { demoUser } from "@/lib/auth/demo";
import { clientEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getEffectiveSubscriptionForUser } from "@/lib/subscriptions/service";

export async function getAttachmentRequestUser(request: NextRequest) {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    return { id: demoUser.id, plan: demoUser.plan };
  }
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;
  if (!token) return null;
  const client = createServerSupabaseClient(token);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  const subscription = await getEffectiveSubscriptionForUser(data.user.id);
  return { id: data.user.id, plan: subscription.plan };
}
