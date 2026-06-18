import type { AppUser } from "@/types";
import type { AuthProvider, AuthResult } from "@/lib/auth/types";
import type { SignInInput, SignUpInput } from "@/lib/validation/auth";

export const demoUser: AppUser = {
  id: "demo-user",
  email: "demo@ceoteca.com",
  fullName: "Usuario Demo",
  plan: "pro",
  isDemo: true,
};

export class DemoAuthProvider implements AuthProvider {
  async getCurrentUser(): Promise<AppUser> {
    return demoUser;
  }

  async signIn(input: SignInInput): Promise<AuthResult> {
    return {
      user: {
        ...demoUser,
        email: input.email,
      },
      redirectTo: "/home",
      message: "Sesión demo iniciada.",
    };
  }

  async signUp(input: SignUpInput): Promise<AuthResult> {
    return {
      user: {
        ...demoUser,
        email: input.email,
        fullName: input.fullName,
        plan: input.plan,
      },
      redirectTo: "/home",
      message: `Cuenta demo creada en plan ${input.plan}.`,
    };
  }

  async signOut(): Promise<void> {
    return Promise.resolve();
  }

  async signInWithGoogle(plan = "free"): Promise<AuthResult> {
    return {
      user: {
        ...demoUser,
        plan: plan === "free" ? "free" : demoUser.plan,
      },
      redirectTo: "/home",
      message: "Google OAuth está preparado en modo demo.",
    };
  }
}
