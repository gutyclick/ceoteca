import { DemoAuthProvider } from "@/lib/auth/demo";
import { SupabaseAuthProvider } from "@/lib/auth/supabase";
import type { AuthProvider } from "@/lib/auth/types";
import { clientEnv } from "@/lib/env";

export function createAuthProvider(): AuthProvider {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    return new DemoAuthProvider();
  }

  return new SupabaseAuthProvider();
}
