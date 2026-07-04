import type { Metadata } from "next";

import { PasswordResetRequestView } from "@/components/auth/PasswordResetRequestView";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  description: "Solicita un enlace seguro para recuperar tu cuenta de Ceoteca.",
};

export default function RecuperarPasswordPage() {
  return <PasswordResetRequestView />;
}
