import { createClient } from "@supabase/supabase-js";

import { clientEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export function createBrowserSupabaseClient() {
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
  );
}
