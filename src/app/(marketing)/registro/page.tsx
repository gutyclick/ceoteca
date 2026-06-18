import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Registro",
  description: "Crea una cuenta en Ceoteca con el plan seleccionado.",
};

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
