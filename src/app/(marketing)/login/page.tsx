import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Login",
  description: "Inicia sesión en Ceoteca.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
