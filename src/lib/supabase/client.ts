import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { clientEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

let browserClient: SupabaseClient<Database> | null = null;

export function createBrowserSupabaseClient() {
  if (
    clientEnv.NEXT_PUBLIC_DEMO_MODE ||
    !clientEnv.NEXT_PUBLIC_SUPABASE_URL ||
    !clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error("Supabase no está configurado para producción.");
  }

  browserClient ??= createClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        storage: window.localStorage,
        storageKey: "ceoteca-auth-session",
      },
    },
  );

  return browserClient;
}
