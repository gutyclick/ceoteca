import { NextRequest } from "next/server";

import { jsonData, jsonError } from "@/lib/api/response";
import { defaultAvatarUrl, isCeotecaAvatar } from "@/config/avatars";
import { clientEnv } from "@/lib/env";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase/server";

const TERMS_VERSION = "2026-07-03";
const PRIVACY_VERSION = "2026-07-03";

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

function getIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    return jsonData({ ok: true });
  }

  const accessToken = getBearerToken(request);

  if (!accessToken) {
    return jsonError(
      { code: "UNAUTHORIZED", message: "No pudimos validar tu sesión." },
      401,
    );
  }

  const authClient = createServerSupabaseClient(accessToken);
  const { data, error } = await authClient.auth.getUser(accessToken);

  if (error || !data.user) {
    return jsonError(
      { code: "UNAUTHORIZED", message: "No pudimos validar tu usuario." },
      401,
    );
  }

  const ip = getIp(request);
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const acceptedAt = new Date().toISOString();
  const serviceClient = createServiceSupabaseClient();
  const metadata = data.user.user_metadata;
  const fullName =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
        ? metadata.name
        : data.user.email ?? "Usuario";
  const { data: existingProfile } = await serviceClient
    .from("profiles")
    .select("onboarding_completed,plan,terms_accepted_at,avatar_url")
    .eq("id", data.user.id)
    .maybeSingle();

  const profileResponse = await serviceClient.from("profiles").upsert({
    id: data.user.id,
    full_name: fullName,
    avatar_url: isCeotecaAvatar(existingProfile?.avatar_url)
      ? existingProfile?.avatar_url
      : defaultAvatarUrl,
    plan: existingProfile?.plan ?? "free",
    onboarding_completed: existingProfile?.onboarding_completed ?? false,
    terms_accepted_at: existingProfile?.terms_accepted_at ?? acceptedAt,
    terms_version: existingProfile?.terms_accepted_at ? undefined : TERMS_VERSION,
    privacy_accepted_at: existingProfile?.terms_accepted_at ? undefined : acceptedAt,
    privacy_version: existingProfile?.terms_accepted_at ? undefined : PRIVACY_VERSION,
    legal_acceptance_ip: existingProfile?.terms_accepted_at ? undefined : ip,
    legal_acceptance_user_agent: existingProfile?.terms_accepted_at
      ? undefined
      : userAgent,
  });

  await serviceClient.from("auth_events").insert({
    user_id: data.user.id,
    email: data.user.email ?? null,
    event_type: "oauth_callback",
    provider: "google",
    code: profileResponse.error ? "PROFILE_UPDATE_FAILED" : "OAUTH_COMPLETED",
    message: profileResponse.error?.message ?? null,
    ip,
    user_agent: userAgent,
    metadata: {
      termsVersion: TERMS_VERSION,
      privacyVersion: PRIVACY_VERSION,
    },
  });

  if (profileResponse.error) {
    return jsonError(
      { code: "PROFILE_UPDATE_FAILED", message: "No pudimos preparar tu perfil." },
      500,
    );
  }

  return jsonData({ ok: true });
}
