"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { SectionHeading } from "@/components/marketing/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { passwordUpdateSchema } from "@/lib/validation/auth";

type NewPasswordValues = {
  password: string;
  confirmPassword: string;
};

type FormStatus =
  | { type: "loading"; message: string }
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export function NewPasswordView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<FormStatus>({
    type: "loading",
    message: "Validando tu enlace de recuperación.",
  });
  const [showPassword, setShowPassword] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<NewPasswordValues>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    let isMounted = true;

    async function prepareRecoverySession() {
      try {
        const supabase = createBrowserSupabaseClient();
        const code = searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }
        }

        const { data } = await supabase.auth.getSession();

        if (!data.session) {
          throw new Error("Tu enlace expiró. Solicita uno nuevo para continuar.");
        }

        if (isMounted) {
          setStatus({ type: "idle" });
        }
      } catch (error) {
        if (isMounted) {
          setStatus({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "Tu enlace expiró. Solicita uno nuevo para continuar.",
          });
        }
      }
    }

    void prepareRecoverySession();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  async function onSubmit(values: NewPasswordValues) {
    setStatus({ type: "idle" });
    const parsed = passwordUpdateSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (field === "password" || field === "confirmPassword") {
          setError(field, { message: issue.message });
        }
      }
      return;
    }

    try {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;

      if (!accessToken) {
        throw new Error("Tu enlace expiró. Solicita uno nuevo para continuar.");
      }

      const response = await fetch("/api/auth/password-reset/update", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });
      const payload = (await response.json()) as {
        data?: { message: string };
        error?: { message: string };
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "No pudimos actualizar tu contraseña.");
      }

      await supabase.auth.signOut();
      setStatus({ type: "success", message: payload.data.message });
      window.setTimeout(() => router.replace("/login"), 900);
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "No pudimos actualizar tu contraseña.",
      });
    }
  }

  const isBlocked = status.type === "loading" || status.type === "error";

  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfaf8] text-slate-950">
      <section className="ceoteca-container relative grid gap-10 py-16 md:py-24 lg:grid-cols-[0.85fr_1fr] lg:items-center">
        <div className="absolute left-0 top-20 -z-10 h-80 w-80 rounded-full bg-violet-100/80 blur-3xl" />
        <SectionHeading
          eyebrow="Nuevo acceso"
          title="Crea una nueva contraseña."
          description="Elige una contraseña segura para proteger tu cuenta y volver a tu biblioteca."
        />

        <Card className="mx-auto w-full max-w-xl border-slate-950/[0.08] bg-white p-6 text-slate-950 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:p-8">
          {status.type !== "idle" ? (
            <div
              className={
                status.type === "success"
                  ? "mb-5 rounded-2xl border border-success/30 bg-success/10 p-4 text-sm text-success"
                  : status.type === "error"
                    ? "mb-5 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger"
                    : "mb-5 rounded-2xl border border-slate-950/10 bg-slate-50 p-4 text-sm text-slate-600"
              }
            >
              {status.message}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <label className="grid gap-2 text-sm">
              Nueva contraseña
              <span className="relative">
                <input
                  className="min-h-12 w-full rounded-button border border-slate-950/10 bg-white px-4 pr-12 text-slate-950 outline-none transition focus:border-brand-purple"
                  disabled={isBlocked}
                  placeholder="Mínimo 10 caracteres"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                />
                <button
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-slate-500 transition hover:bg-violet-50 hover:text-violet-700"
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" size={18} />
                  ) : (
                    <Eye aria-hidden="true" size={18} />
                  )}
                </button>
              </span>
              {errors.password ? (
                <span className="text-xs text-danger">
                  {errors.password.message}
                </span>
              ) : null}
            </label>

            <label className="grid gap-2 text-sm">
              Confirmar contraseña
              <input
                className="min-h-12 rounded-button border border-slate-950/10 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-purple"
                disabled={isBlocked}
                placeholder="Repite tu contraseña"
                type={showPassword ? "text" : "password"}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword ? (
                <span className="text-xs text-danger">
                  {errors.confirmPassword.message}
                </span>
              ) : null}
            </label>

            <Button
              className="w-full shadow-[0_18px_42px_rgba(124,58,237,0.22)]"
              disabled={isBlocked || isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <Loader2 aria-hidden="true" className="animate-spin" size={18} />
              ) : null}
              {isSubmitting ? "Actualizando..." : "Actualizar contraseña"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            ¿Necesitas otro enlace?{" "}
            <Link
              className="font-medium text-brand-purple"
              href="/recuperar-password"
            >
              Solicítalo aquí
            </Link>
          </p>
        </Card>
      </section>
    </main>
  );
}
