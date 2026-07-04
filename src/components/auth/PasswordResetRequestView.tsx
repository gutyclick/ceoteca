"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { SectionHeading } from "@/components/marketing/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { passwordResetRequestSchema } from "@/lib/validation/auth";

type ResetRequestValues = {
  email: string;
};

type FormStatus =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export function PasswordResetRequestView() {
  const [status, setStatus] = useState<FormStatus>({ type: "idle" });
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<ResetRequestValues>({
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ResetRequestValues) {
    setStatus({ type: "idle" });
    const parsed = passwordResetRequestSchema.safeParse(values);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setError("email", { message: issue?.message ?? "Ingresa un email válido." });
      return;
    }

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });
      const payload = (await response.json()) as {
        data?: { message: string };
        error?: { message: string };
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "No pudimos enviar el enlace.");
      }

      setStatus({ type: "success", message: payload.data.message });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "No pudimos enviar el enlace.",
      });
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-text-primary">
      <section className="ceoteca-container ceoteca-section relative grid gap-10 lg:grid-cols-[0.85fr_1fr] lg:items-center">
        <div className="ambient-drift absolute left-0 top-20 -z-10 h-80 w-80 rounded-full bg-glow-violet blur-3xl" />
        <SectionHeading
          eyebrow="Recuperar acceso"
          title="Restablece tu contraseña."
          description="Escribe el email de tu cuenta y te enviaremos un enlace seguro para crear una nueva contraseña."
        />

        <Card className="mx-auto w-full max-w-xl p-6 md:p-8">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <label className="grid gap-2 text-sm">
              Email
              <input
                className="min-h-12 rounded-button border border-white/10 bg-white/[0.04] px-4 text-text-primary outline-none transition focus:border-brand-purple"
                placeholder="tu@email.com"
                type="email"
                {...register("email")}
              />
              {errors.email ? (
                <span className="text-xs text-danger">{errors.email.message}</span>
              ) : null}
            </label>

            {status.type !== "idle" ? (
              <div
                className={
                  status.type === "success"
                    ? "rounded-2xl border border-success/30 bg-success/10 p-4 text-sm text-success"
                    : "rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger"
                }
              >
                {status.message}
              </div>
            ) : null}

            <Button className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <Loader2 aria-hidden="true" className="animate-spin" size={18} />
              ) : null}
              {isSubmitting ? "Enviando enlace..." : "Enviar enlace seguro"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            ¿Recordaste tu contraseña?{" "}
            <Link className="font-medium text-brand-purple" href="/login">
              Inicia sesión
            </Link>
          </p>
        </Card>
      </section>
    </main>
  );
}
