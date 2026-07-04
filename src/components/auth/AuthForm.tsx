"use client";

import { Chrome, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { ZodError } from "zod";

import { SectionHeading } from "@/components/marketing/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PlanKey } from "@/config/plans";
import { createAuthProvider } from "@/lib/auth/provider";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
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
  website?: string;
};

type FormStatus =
  | { type: "idle"; message?: never }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

type RegisterApiResponse = {
  data?: {
    session: {
      accessToken: string;
      refreshToken: string;
    } | null;
    requiresEmailConfirmation: boolean;
    redirectTo: string | null;
    message: string;
  };
  error?: {
    message: string;
    fieldErrors?: Partial<Record<keyof AuthFormValues, string[]>>;
  };
};

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

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/home";
  }

  return value;
}

function getPasswordScore(password: string) {
  return [
    password.length >= 10,
    /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(password),
    /\d/.test(password),
    /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\d]/.test(password),
  ].filter(Boolean).length;
}

function getPasswordLabel(score: number) {
  if (score <= 1) {
    return "Débil";
  }

  if (score <= 3) {
    return "Buena";
  }

  return "Fuerte";
}

export function AuthForm({ mode, selectedPlan = "free" }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(
    () => getSafeNextPath(searchParams.get("next")),
    [searchParams],
  );
  const authProvider = useMemo(() => createAuthProvider(), []);
  const isRegister = mode === "register";
  const [status, setStatus] = useState<FormStatus>({ type: "idle" });
  const [passwordValue, setPasswordValue] = useState("");
  const passwordScore = getPasswordScore(passwordValue);

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
      website: "",
    },
  });
  const passwordRegistration = register("password");

  useEffect(() => {
    let isMounted = true;

    async function redirectActiveSession() {
      const user = await authProvider.getCurrentUser();

      if (!isMounted || !user) {
        return;
      }

      if (isRegister) {
        try {
          const supabase = createBrowserSupabaseClient();
          const { data } = await supabase
            .from("profiles")
            .select("onboarding_completed")
            .eq("id", user.id)
            .maybeSingle();

          router.replace(data?.onboarding_completed ? "/home" : "/planes");
        } catch {
          router.replace("/planes");
        }
        router.refresh();
        return;
      }

      router.replace(nextPath);
      router.refresh();
    }

    void redirectActiveSession();

    return () => {
      isMounted = false;
    };
  }, [authProvider, isRegister, nextPath, router]);

  function setApiFieldErrors(
    fieldErrors?: Partial<Record<keyof AuthFormValues, string[]>>,
  ) {
    if (!fieldErrors) {
      return;
    }

    for (const [field, messages] of Object.entries(fieldErrors)) {
      if (messages?.[0]) {
        setError(field as keyof AuthFormValues, { message: messages[0] });
      }
    }
  }

  async function onSubmit(values: AuthFormValues) {
    setStatus({ type: "idle" });

    try {
      const result = isRegister
        ? await submitSignUp(values)
        : await submitSignIn(values);

      setStatus({
        type: "success",
        message: result.message,
      });

      if (result.redirectTo) {
        router.push(isRegister ? result.redirectTo : nextPath);
        router.refresh();
      }
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

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsed.data),
    });
    const payload = (await response.json()) as RegisterApiResponse;

    if (!response.ok || !payload.data) {
      setApiFieldErrors(payload.error?.fieldErrors);
      throw new Error(payload.error?.message ?? "No pudimos crear tu cuenta.");
    }

    if (payload.data.session) {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.setSession({
        access_token: payload.data.session.accessToken,
        refresh_token: payload.data.session.refreshToken,
      });

      if (error) {
        throw new Error(
          "Tu cuenta fue creada, pero no pudimos iniciar la sesión automáticamente.",
        );
      }
    }

    return {
      redirectTo: payload.data.redirectTo ?? undefined,
      message: payload.data.message,
    };
  }

  async function handleGoogleAuth() {
    setStatus({ type: "idle" });

    try {
      const result = await authProvider.signInWithGoogle(
        isRegister ? "/planes" : "/home",
      );
      setStatus({
        type: "success",
        message: result.message,
      });

      if (result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      }
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "No pudimos conectar con Google.",
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
                ? "Crea tu cuenta y luego elige tu plan para activar el acceso."
                : "Ingresa con email y contraseña para volver a tu home."
            }
          />
        </div>

        <Card className="mx-auto w-full max-w-xl p-6 md:p-8">
          <Button
            className="w-full"
            onClick={handleGoogleAuth}
            type="button"
            variant="secondary"
          >
            <Chrome aria-hidden="true" size={18} />
            Continuar con Google
          </Button>
          {isRegister ? (
            <p className="mt-3 text-center text-xs leading-5 text-text-muted">
              Al continuar con Google aceptas nuestros{" "}
              <Link className="text-brand-purple" href="/terminos">
                términos
              </Link>{" "}
              y nuestra{" "}
              <Link className="text-brand-purple" href="/privacidad">
                política de privacidad
              </Link>
              .
            </p>
          ) : null}

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
                placeholder={isRegister ? "Mínimo 10 caracteres" : "Tu contraseña"}
                type="password"
                {...passwordRegistration}
                onChange={(event) => {
                  passwordRegistration.onChange(event);
                  setPasswordValue(event.target.value);
                }}
              />
              {isRegister ? (
                <div className="grid gap-2">
                  <div className="grid grid-cols-4 gap-1">
                    {Array.from({ length: 4 }, (_, index) => (
                      <span
                        className={
                          index < passwordScore
                            ? "h-1.5 rounded-full bg-brand-purple"
                            : "h-1.5 rounded-full bg-white/10"
                        }
                        key={index}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-text-muted">
                    Seguridad: {getPasswordLabel(passwordScore)}. Usa al menos
                    10 caracteres, una letra y un número.
                  </p>
                </div>
              ) : null}
              {errors.password ? (
                <span className="text-xs text-danger">
                  {errors.password.message}
                </span>
              ) : null}
            </label>

            {isRegister ? (
              <>
                <input type="hidden" value="free" {...register("plan")} />
                <label className="sr-only">
                  Sitio web
                  <input
                    autoComplete="off"
                    tabIndex={-1}
                    {...register("website")}
                  />
                </label>
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
              {isRegister ? "Crear cuenta" : "Iniciar sesión"}
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
