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
      redirectTo: "/planes",
      message: "Cuenta demo creada. Elige tu plan para activar el acceso.",
    };
  }

  async signOut(): Promise<void> {
    return Promise.resolve();
  }

  async signInWithGoogle(redirectTo = "/home"): Promise<AuthResult> {
    return {
      user: {
        ...demoUser,
      },
      redirectTo,
      message: "Google OAuth está preparado en modo demo.",
    };
  }
}
