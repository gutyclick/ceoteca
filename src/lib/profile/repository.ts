import { demoUser } from "@/lib/auth/demo";
import { clientEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AppUser } from "@/types";

export interface ProfileRepository {
  getCurrentProfile(userId: string): Promise<AppUser | null>;
}

export class MockProfileRepository implements ProfileRepository {
  async getCurrentProfile(): Promise<AppUser> {
    return demoUser;
  }
}

export class SupabaseProfileRepository implements ProfileRepository {
  async getCurrentProfile(userId: string): Promise<AppUser | null> {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, plan")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      email: "",
      fullName: data.full_name ?? "Usuario",
      plan: data.plan,
      isDemo: false,
    };
  }
}

export function createProfileRepository(): ProfileRepository {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    return new MockProfileRepository();
  }

  return new SupabaseProfileRepository();
}
