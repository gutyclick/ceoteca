import type { AuthProvider, AuthResult } from "@/lib/auth/types";
import type { SignInInput, SignUpInput } from "@/lib/validation/auth";
import type { AppUser } from "@/types";

const pendingMessage =
  "Supabase Auth está preparado, pero la conexión real se implementa en una fase posterior.";

export class SupabaseAuthProvider implements AuthProvider {
  async getCurrentUser(): Promise<AppUser | null> {
    return null;
  }

  async signIn(input: SignInInput): Promise<AuthResult> {
    void input;
    throw new Error(pendingMessage);
  }

  async signUp(input: SignUpInput): Promise<AuthResult> {
    void input;
    throw new Error(pendingMessage);
  }

  async signOut(): Promise<void> {
    return Promise.resolve();
  }

  async signInWithGoogle(): Promise<AuthResult> {
    throw new Error(pendingMessage);
  }
}
