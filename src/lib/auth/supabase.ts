import type { AuthProvider, AuthResult } from "@/lib/auth/types";
import type { SignInInput, SignUpInput } from "@/lib/validation/auth";
import { clientEnv } from "@/lib/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { AppUser } from "@/types";

function getOAuthBaseUrl() {
  const configuredUrl = new URL(clientEnv.NEXT_PUBLIC_SITE_URL);

  if (configuredUrl.hostname === "localhost") {
    return window.location.origin;
  }

  return configuredUrl.origin;
}

function translateSignInError(message?: string) {
  const normalized = message?.toLowerCase() ?? "";

  if (normalized.includes("invalid login credentials")) {
    return "El email o la contraseña no coinciden.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Confirma tu correo antes de iniciar sesión.";
  }

  if (normalized.includes("too many")) {
    return "Has realizado varios intentos. Espera unos minutos antes de volver a intentarlo.";
  }

  return "No pudimos iniciar sesión.";
}

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
      throw new Error(translateSignInError(error?.message));
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
      throw new Error("No pudimos crear la cuenta.");
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
    const safeRedirectTo =
      redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/home";
    const callbackUrl = new URL("/auth/callback", getOAuthBaseUrl());
    callbackUrl.searchParams.set("next", safeRedirectTo);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      throw new Error("No pudimos conectar con Google.");
    }

    return {
      user: {
        id: "pending-oauth",
        email: "",
        fullName: "Google OAuth",
        plan: "free",
        isDemo: false,
      },
      redirectTo: "",
      message: "Te estamos llevando a Google.",
    };
  }
}
