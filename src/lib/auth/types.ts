import type { AppUser } from "@/types";
import type { SignInInput, SignUpInput } from "@/lib/validation/auth";

export type AuthResult = {
  user: AppUser;
  redirectTo: string;
  message: string;
};

export interface AuthProvider {
  getCurrentUser(): Promise<AppUser | null>;
  signIn(input: SignInInput): Promise<AuthResult>;
  signUp(input: SignUpInput): Promise<AuthResult>;
  signOut(): Promise<void>;
  signInWithGoogle(redirectTo?: string): Promise<AuthResult>;
}
