import { createClient } from "@supabase/supabase-js";

import { assertSupabaseServiceRole, clientEnv, serverEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export function createServerSupabaseClient(accessToken?: string) {
  if (
    clientEnv.NEXT_PUBLIC_DEMO_MODE ||
    !clientEnv.NEXT_PUBLIC_SUPABASE_URL ||
    !clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error("Supabase no esta configurado para produccion.");
  }

  return createClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    accessToken
      ? {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        }
      : undefined,
  );
}

export function createServiceSupabaseClient() {
  assertSupabaseServiceRole();

  if (
    clientEnv.NEXT_PUBLIC_DEMO_MODE ||
    !clientEnv.NEXT_PUBLIC_SUPABASE_URL ||
    !serverEnv.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error("Supabase service role no esta configurado para produccion.");
  }

  return createClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
