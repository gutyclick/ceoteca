import type { Metadata } from "next";
import { Suspense } from "react";

import { NewPasswordView } from "@/components/auth/NewPasswordView";

export const metadata: Metadata = {
  title: "Nueva contraseña",
  description: "Crea una nueva contraseña para tu cuenta de Ceoteca.",
};

export default function NuevaPasswordPage() {
  return (
    <Suspense fallback={null}>
      <NewPasswordView />
    </Suspense>
  );
}
