import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/AuthForm";
import { parsePlanKey } from "@/lib/plans/parse";

export const metadata: Metadata = {
  title: "Registro",
  description: "Crea una cuenta demo en Ceoteca con el plan seleccionado.",
};

type RegisterPageProps = {
  searchParams: Promise<{
    plan?: string | string[];
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const selectedPlan = parsePlanKey(params.plan);

  return <AuthForm mode="register" selectedPlan={selectedPlan} />;
}
