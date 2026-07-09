"use client";

import { Check, Chrome, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { ZodError } from "zod";

import { SectionHeading } from "@/components/marketing/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import type { PlanKey } from "@/config/plans";
import { createAuthProvider } from "@/lib/auth/provider";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";
import { cn } from "@/lib/utils/cn";

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

type SessionPayload = {
  accessToken: string;
  refreshToken: string;
};

type AuthApiResponse = {
  data?: {
    session: SessionPayload | null;
    redirectTo: string | null;
    message: string;
  };
  error?: {
    code?: string;
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
  const [showPassword, setShowPassword] = useState(false);
  const [pendingEmailForConfirmation, setPendingEmailForConfirmation] =
    useState<string | null>(null);
  const [isResendingConfirmation, setIsResendingConfirmation] = useState(false);
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

  async function storeSession(session: SessionPayload | null) {
    if (!session) {
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.setSession({
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
    });

    if (error) {
      throw new Error("No pudimos guardar tu sesión en este navegador.");
    }
  }

  async function onSubmit(values: AuthFormValues) {
    setStatus({ type: "idle" });
    setPendingEmailForConfirmation(null);

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

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsed.data),
    });
    const payload = (await response.json()) as AuthApiResponse;

    if (!response.ok || !payload.data) {
      setApiFieldErrors(payload.error?.fieldErrors);

      if (payload.error?.code === "EMAIL_NOT_CONFIRMED") {
        setPendingEmailForConfirmation(parsed.data.email);
      }

      throw new Error(payload.error?.message ?? "No pudimos iniciar sesión.");
    }

    await storeSession(payload.data.session);

    return {
      redirectTo: payload.data.redirectTo ?? "/home",
      message: payload.data.message,
    };
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
    const payload = (await response.json()) as AuthApiResponse;

    if (!response.ok || !payload.data) {
      setApiFieldErrors(payload.error?.fieldErrors);
      throw new Error(payload.error?.message ?? "No pudimos crear tu cuenta.");
    }

    await storeSession(payload.data.session);

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

  async function resendConfirmation() {
    if (!pendingEmailForConfirmation) {
      return;
    }

    setIsResendingConfirmation(true);

    try {
      const response = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: pendingEmailForConfirmation }),
      });
      const payload = (await response.json()) as {
        data?: { message: string };
        error?: { message: string };
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "No pudimos reenviar el correo.");
      }

      setStatus({
        type: "success",
        message: payload.data.message,
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "No pudimos reenviar el correo.",
      });
    } finally {
      setIsResendingConfirmation(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbfaf8] text-slate-950">
      <section
        className={cn(
          "ceoteca-container relative grid min-h-screen gap-8 py-6 sm:py-8 lg:grid-cols-[0.9fr_1fr] lg:items-center",
          isRegister
            ? "lg:gap-10"
            : "lg:gap-14",
        )}
      >
        <div className="absolute left-0 top-20 -z-10 h-80 w-80 rounded-full bg-violet-100/80 blur-3xl" />
        <div className="absolute bottom-0 right-0 -z-10 h-96 w-96 rounded-full bg-fuchsia-100/80 blur-3xl" />
        <div className="mx-auto w-full max-w-xl">
          <div className="mb-8 flex items-center justify-between gap-4">
            <Logo
              className="text-slate-950 [&>span]:text-slate-950"
              useBrandAsset
            />
            <Link
              className="rounded-full border border-slate-950/[0.08] bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:border-violet-200 hover:text-violet-700"
              href="/"
            >
              Inicio
            </Link>
          </div>
          <SectionHeading
            eyebrow={isRegister ? "Registro" : "Inicio de sesión"}
            title={
              isRegister
                ? "Crea tu cuenta para empezar a aprender."
                : "Vuelve a tu biblioteca de aprendizaje."
            }
            description={
              isRegister
                ? "Crea tu cuenta y luego elige tu plan para activar el acceso."
                : "Ingresa con email y contraseña para continuar tu progreso."
            }
          />
          <div className="mt-6 hidden overflow-hidden rounded-[1.5rem] border border-slate-950/[0.08] bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] lg:block">
            <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.22em] text-violet-600">
              <Sparkles aria-hidden="true" size={16} />
              Ceoteca
            </p>
            <h2 className="mt-3 text-[clamp(1.7rem,2.3vw,2.4rem)] font-black leading-tight">
              Aprende ideas clave y conviértelas en acción.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Análisis editoriales, ejercicios prácticos y recomendaciones para
              complementar tus lecturas sin reemplazar la obra original.
            </p>
          </div>
        </div>

        <Card
          className={cn(
            "mx-auto w-full max-w-xl border-slate-950/[0.08] bg-white text-slate-950 shadow-[0_24px_80px_rgba(15,23,42,0.08)]",
            isRegister ? "p-4 sm:p-5" : "p-5 sm:p-6 md:p-7",
          )}
        >
          <button
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-button border border-slate-950/10 bg-white px-5 text-sm font-bold text-slate-900 shadow-sm transition duration-200 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-purple"
            onClick={handleGoogleAuth}
            type="button"
          >
            <Chrome aria-hidden="true" size={18} />
            Continuar con Google
          </button>
          {isRegister ? (
            <p className="mt-3 text-center text-xs leading-5 text-slate-500">
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

          <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            o con email
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <form
            className={cn(isRegister ? "space-y-3" : "space-y-3.5")}
            onSubmit={handleSubmit(onSubmit)}
          >
            {isRegister ? (
              <label className="grid gap-2 text-sm">
                Nombre
                <input
                  autoComplete="name"
                  className="min-h-11 rounded-button border border-slate-950/10 bg-white px-4 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
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
                autoComplete="email"
                className="min-h-11 rounded-button border border-slate-950/10 bg-white px-4 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
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
              <span className="relative">
                <input
                  className="min-h-11 w-full rounded-button border border-slate-950/10 bg-white px-4 pr-12 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  placeholder={isRegister ? "Mínimo 10 caracteres" : "Tu contraseña"}
                  type={showPassword ? "text" : "password"}
                  {...passwordRegistration}
                  onChange={(event) => {
                    passwordRegistration.onChange(event);
                    setPasswordValue(event.target.value);
                  }}
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
              {isRegister ? (
                <div className="grid gap-2">
                  <div className="grid grid-cols-4 gap-1">
                    {Array.from({ length: 4 }, (_, index) => (
                      <span
                        className={
                          index < passwordScore
                            ? "h-1.5 rounded-full bg-brand-purple"
                            : "h-1.5 rounded-full bg-slate-200"
                        }
                        key={index}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
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
                    className="min-h-11 rounded-button border border-slate-950/10 bg-white px-4 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
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
                <label className="group flex items-start gap-3 text-sm leading-6 text-slate-600">
                  <input
                    className="peer sr-only"
                    type="checkbox"
                    {...register("acceptedTerms")}
                  />
                  <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border border-slate-300 bg-white text-white shadow-sm transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-purple peer-checked:border-violet-600 peer-checked:bg-violet-600 group-hover:border-violet-300">
                    <Check aria-hidden="true" size={14} strokeWidth={3} />
                  </span>
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

            {pendingEmailForConfirmation ? (
              <button
                className="w-full rounded-2xl border border-brand-purple/35 bg-brand-purple/10 px-4 py-3 text-sm font-medium text-brand-purple transition hover:border-brand-purple/70 hover:bg-brand-purple/15 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isResendingConfirmation}
                onClick={() => void resendConfirmation()}
                type="button"
              >
                {isResendingConfirmation
                  ? "Enviando confirmación..."
                  : "Reenviar correo de confirmación"}
              </button>
            ) : null}

            {!isRegister ? (
              <div className="text-right">
                <Link
                  className="text-sm font-medium text-brand-purple transition hover:text-violet-800"
                  href="/recuperar-password"
                >
                  Olvidé mi contraseña
                </Link>
              </div>
            ) : null}

            <Button
              className="min-h-11 w-full shadow-[0_18px_42px_rgba(124,58,237,0.22)]"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <Loader2 aria-hidden="true" className="animate-spin" size={18} />
              ) : null}
              {isSubmitting
                ? isRegister
                  ? "Creando cuenta..."
                  : "Verificando acceso..."
                : isRegister
                  ? "Crear cuenta"
                  : "Iniciar sesión"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
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
