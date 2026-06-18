"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Chrome, Loader2 } from "lucide-react";
import type { ZodError } from "zod";

import { SectionHeading } from "@/components/marketing/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { plans, type PlanKey } from "@/config/plans";
import { createAuthProvider } from "@/lib/auth/provider";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";

type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
  selectedPlan?: PlanKey;
};

type AuthFormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
  plan: PlanKey;
};

type FormStatus =
  | { type: "idle"; message?: never }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

function applyZodErrors(
  error: ZodError,
  setError: ReturnType<typeof useForm<AuthFormValues>>["setError"],
) {
  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field === "string") {
      setError(field as keyof AuthFormValues, { message: issue.message });
    }
  }
}

export function AuthForm({ mode, selectedPlan = "free" }: AuthFormProps) {
  const [status, setStatus] = useState<FormStatus>({ type: "idle" });
  const authProvider = useMemo(() => createAuthProvider(), []);
  const isRegister = mode === "register";
  const plan = plans[selectedPlan];

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<AuthFormValues>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptedTerms: false,
      plan: selectedPlan,
    },
  });

  async function onSubmit(values: AuthFormValues) {
    setStatus({ type: "idle" });

    try {
      const result = isRegister
        ? await submitSignUp(values)
        : await submitSignIn(values);

      setStatus({
        type: "success",
        message: `${result.message} Redirección preparada a ${result.redirectTo}.`,
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "No pudimos completar la solicitud.",
      });
    }
  }

  async function submitSignIn(values: AuthFormValues) {
    const parsed = signInSchema.safeParse(values);

    if (!parsed.success) {
      applyZodErrors(parsed.error, setError);
      throw new Error("Revisa los campos marcados.");
    }

    return authProvider.signIn(parsed.data);
  }

  async function submitSignUp(values: AuthFormValues) {
    const parsed = signUpSchema.safeParse(values);

    if (!parsed.success) {
      applyZodErrors(parsed.error, setError);
      throw new Error("Revisa los campos marcados.");
    }

    return authProvider.signUp(parsed.data);
  }

  async function handleGoogleAuth() {
    setStatus({ type: "idle" });

    try {
      const result = await authProvider.signInWithGoogle(selectedPlan);
      setStatus({
        type: "success",
        message: `${result.message} Redirección preparada a ${result.redirectTo}.`,
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Google OAuth todavía no está disponible.",
      });
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-text-primary">
      <section className="ceoteca-container ceoteca-section relative grid gap-10 lg:grid-cols-[0.85fr_1fr] lg:items-center">
        <div className="ambient-drift absolute left-0 top-20 -z-10 h-80 w-80 rounded-full bg-glow-violet blur-3xl" />
        <div>
          <SectionHeading
            eyebrow={isRegister ? "Registro" : "Login"}
            title={
              isRegister
                ? "Crea tu cuenta para empezar a aprender."
                : "Vuelve a tu biblioteca de aprendizaje."
            }
            description={
              isRegister
                ? "El modo demo crea una sesión simulada y respeta el plan seleccionado."
                : "Ingresa con email y contraseña. En modo demo no se requieren credenciales reales."
            }
          />
        </div>

        <Card className="mx-auto w-full max-w-xl p-6 md:p-8">
          {isRegister ? (
            <div className="mb-6 rounded-2xl border border-brand-purple/30 bg-brand-purple/10 p-4">
              <p className="text-sm font-medium">Plan seleccionado: {plan.name}</p>
              <p className="mt-1 text-sm text-text-secondary">
                Puedes cambiarlo desde pricing antes de crear la cuenta.
              </p>
            </div>
          ) : null}

          <Button
            className="w-full"
            onClick={handleGoogleAuth}
            type="button"
            variant="secondary"
          >
            <Chrome aria-hidden="true" size={18} />
            Continuar con Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-text-muted">
            <span className="h-px flex-1 bg-white/10" />
            o con email
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {isRegister ? (
              <label className="grid gap-2 text-sm">
                Nombre
                <input
                  className="min-h-12 rounded-button border border-white/10 bg-white/[0.04] px-4 text-text-primary outline-none transition focus:border-brand-purple"
                  placeholder="Tu nombre"
                  {...register("fullName")}
                />
                {errors.fullName ? (
                  <span className="text-xs text-danger">
                    {errors.fullName.message}
                  </span>
                ) : null}
              </label>
            ) : null}

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

            <label className="grid gap-2 text-sm">
              Contraseña
              <input
                className="min-h-12 rounded-button border border-white/10 bg-white/[0.04] px-4 text-text-primary outline-none transition focus:border-brand-purple"
                placeholder="Mínimo 8 caracteres"
                type="password"
                {...register("password")}
              />
              {errors.password ? (
                <span className="text-xs text-danger">
                  {errors.password.message}
                </span>
              ) : null}
            </label>

            {isRegister ? (
              <>
                <input type="hidden" value={selectedPlan} {...register("plan")} />
                <label className="grid gap-2 text-sm">
                  Confirmar contraseña
                  <input
                    className="min-h-12 rounded-button border border-white/10 bg-white/[0.04] px-4 text-text-primary outline-none transition focus:border-brand-purple"
                    placeholder="Repite tu contraseña"
                    type="password"
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword ? (
                    <span className="text-xs text-danger">
                      {errors.confirmPassword.message}
                    </span>
                  ) : null}
                </label>
                <label className="flex items-start gap-3 text-sm leading-6 text-text-secondary">
                  <input
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-white/[0.04]"
                    type="checkbox"
                    {...register("acceptedTerms")}
                  />
                  <span>
                    Acepto{" "}
                    <Link className="text-brand-purple" href="/terminos">
                      términos
                    </Link>{" "}
                    y{" "}
                    <Link className="text-brand-purple" href="/privacidad">
                      privacidad
                    </Link>
                    .
                  </span>
                </label>
                {errors.acceptedTerms ? (
                  <span className="block text-xs text-danger">
                    {errors.acceptedTerms.message}
                  </span>
                ) : null}
              </>
            ) : null}

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
              {isRegister ? "Crear cuenta demo" : "Iniciar sesión demo"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            {isRegister ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
            <Link
              className="font-medium text-brand-purple"
              href={isRegister ? "/login" : "/registro"}
            >
              {isRegister ? "Inicia sesión" : "Regístrate"}
            </Link>
          </p>
        </Card>
      </section>
    </main>
  );
}
