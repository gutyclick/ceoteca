import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCallbackView } from "@/components/auth/AuthCallbackView";

export const metadata: Metadata = {
  title: "Conectando Google",
  description: "Finaliza el inicio de sesión con Google en Ceoteca.",
};

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackView />
    </Suspense>
  );
}
