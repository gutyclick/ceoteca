import type { AuthProvider, AuthResult } from "@/lib/auth/types";
import type { SignInInput, SignUpInput } from "@/lib/validation/auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { AppUser } from "@/types";

export class SupabaseAuthProvider implements AuthProvider {
  async getCurrentUser(): Promise<AppUser | null> {
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email ?? "",
      fullName:
        typeof data.user.user_metadata.full_name === "string"
          ? data.user.user_metadata.full_name
          : "Usuario",
      plan: "free",
      isDemo: false,
    };
  }

  async signIn(input: SignInInput): Promise<AuthResult> {
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error || !data.user) {
      throw new Error(error?.message ?? "No pudimos iniciar sesión.");
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email ?? input.email,
        fullName:
          typeof data.user.user_metadata.full_name === "string"
            ? data.user.user_metadata.full_name
            : "Usuario",
        plan: "free",
        isDemo: false,
      },
      redirectTo: "/home",
      message: "Sesión iniciada.",
    };
  }

  async signUp(input: SignUpInput): Promise<AuthResult> {
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
          requested_plan: input.plan,
        },
      },
    });

    if (error || !data.user) {
      throw new Error(error?.message ?? "No pudimos crear la cuenta.");
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email ?? input.email,
        fullName: input.fullName,
        plan: "free",
        isDemo: false,
      },
      redirectTo: "/planes",
      message: "Cuenta creada. Elige tu plan para activar el acceso.",
    };
  }

  async signOut(): Promise<void> {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
  }

  async signInWithGoogle(redirectTo = "/home"): Promise<AuthResult> {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${redirectTo}`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      user: {
        id: "pending-oauth",
        email: "",
        fullName: "Google OAuth",
        plan: "free",
        isDemo: false,
      },
      redirectTo,
      message: "Redirección a Google preparada.",
    };
  }
}
