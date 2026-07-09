"use client";

import {
  BookOpen,
  Check,
  Chrome,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  MessageSquareText,
  ShieldCheck,
  Star,
  TrendingUp,
  User,
  XCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { ZodError } from "zod";

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

const authBenefits = [
  {
    title: "Aprende más en menos tiempo",
    description: "Análisis claros y accionables para complementar tus lecturas.",
    icon: BookOpen,
  },
  {
    title: "Aplica lo que aprendes",
    description: "Ejercicios prácticos y estrategias concretas para avanzar.",
    icon: Zap,
  },
  {
    title: "Pregúntale a CEO",
    description: "Recibe guía contextual según cada análisis disponible.",
    icon: MessageSquareText,
  },
  {
    title: "Crece cada día",
    description: "Guarda progreso y convierte ideas en resultados visibles.",
    icon: TrendingUp,
  },
];

const authTrustItems = [
  {
    title: "Seguro y privado",
    description: "Tus datos están protegidos",
    icon: ShieldCheck,
  },
  {
    title: "Acceso inmediato",
    description: "Empieza a aprender hoy",
    icon: Zap,
  },
  {
    title: "Sin riesgos",
    description: "Cancela cuando quieras",
    icon: XCircle,
  },
];

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
          "ceoteca-container relative grid min-h-screen gap-6 py-5 sm:py-6 lg:grid-cols-[0.9fr_1fr] lg:items-center",
          isRegister ? "lg:gap-8 xl:gap-10" : "lg:gap-12",
        )}
      >
        <div className="absolute left-0 top-16 -z-10 h-64 w-64 rounded-full bg-violet-100/80 blur-3xl" />
        <div className="absolute bottom-0 right-0 -z-10 h-72 w-72 rounded-full bg-fuchsia-100/75 blur-3xl" />
        <div className="absolute right-0 top-5 hidden items-center gap-2 text-sm text-slate-500 lg:flex">
          <span>{isRegister ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}</span>
          <Link
            className="font-black text-violet-700 transition hover:text-fuchsia-600"
            href={isRegister ? "/login" : "/registro"}
          >
            {isRegister ? "Inicia sesión" : "Regístrate"}
          </Link>
        </div>
        <div className="mx-auto w-full max-w-[520px]">
          <div className="mb-8 flex items-center justify-between gap-4 xl:mb-10">
            <Logo
              className="text-slate-950 [&>span]:text-lg [&>span]:font-black [&>span]:text-slate-950"
              useBrandAsset={false}
            />
            <Link
              className="rounded-full border border-slate-950/[0.08] bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:border-violet-200 hover:text-violet-700 lg:hidden"
              href="/"
            >
              Inicio
            </Link>
          </div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-600">
            {isRegister ? "Únete a Ceoteca" : "Accede a Ceoteca"}
          </p>
          <h1 className="mt-4 text-balance text-[clamp(2.2rem,4.2vw,3.55rem)] font-black leading-[1.02] tracking-[-0.045em] text-slate-950">
            {isRegister
              ? "Crea tu cuenta y empieza a aprender sin límites."
              : "Vuelve a tus ideas, notas y progreso."}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
            {isRegister
              ? "Accede a análisis de libros de negocios, desarrollo personal e inversión, con el apoyo de CEO."
              : "Continúa aprendiendo con análisis editoriales, ejercicios prácticos y recomendaciones personalizadas."}
          </p>
          <div className="mt-7 rounded-[1.35rem] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-5 shadow-[0_18px_54px_rgba(124,58,237,0.07)]">
            <div className="grid gap-4">
              {authBenefits.map((item) => {
                const Icon = item.icon;

                return (
                  <div className="flex items-start gap-3" key={item.title}>
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-700">
                      <Icon aria-hidden="true" size={20} />
                    </span>
                    <span>
                      <span className="block text-sm font-black text-slate-950">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-sm leading-5 text-slate-600">
                        {item.description}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 hidden items-center gap-4 lg:flex">
            <div className="flex -space-x-2">
              {["A", "M", "S", "G"].map((initial) => (
                <span
                  className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-violet-600 to-fuchsia-500 text-xs font-black text-white"
                  key={initial}
                >
                  {initial}
                </span>
              ))}
            </div>
            <div>
              <div className="flex gap-1 text-amber-400">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star aria-hidden="true" fill="currentColor" key={index} size={16} />
                ))}
              </div>
              <p className="mt-1.5 max-w-sm text-xs leading-5 text-slate-600">
                &ldquo;Ceoteca me ayuda a convertir ideas de libros en acciones concretas.&rdquo;
              </p>
            </div>
          </div>
        </div>

        <Card
          className={cn(
            "mx-auto w-full max-w-[590px] rounded-[1.45rem] border-slate-950/[0.08] bg-white text-slate-950 shadow-[0_22px_72px_rgba(15,23,42,0.10)]",
            isRegister ? "p-5 sm:p-6 lg:p-7" : "p-5 sm:p-6 lg:p-7",
          )}
        >
          <button
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[0.85rem] border border-violet-500 bg-white px-5 text-sm font-black text-slate-950 shadow-sm transition duration-200 hover:bg-violet-50 hover:text-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-purple"
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

          <form className="space-y-3.5" onSubmit={handleSubmit(onSubmit)}>
            {isRegister ? (
              <label className="grid gap-1.5 text-sm font-bold text-slate-950">
                Nombre completo
                <span className="relative">
                  <User
                    aria-hidden="true"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    autoComplete="name"
                    className="min-h-11 w-full rounded-[0.8rem] border border-slate-950/10 bg-white pl-11 pr-4 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    placeholder="Tu nombre completo"
                    {...register("fullName")}
                  />
                </span>
                {errors.fullName ? (
                  <span className="text-xs text-danger">
                    {errors.fullName.message}
                  </span>
                ) : null}
              </label>
            ) : null}

            <label className="grid gap-1.5 text-sm font-bold text-slate-950">
              Correo electrónico
              <span className="relative">
                <Mail
                  aria-hidden="true"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  autoComplete="email"
                  className="min-h-11 w-full rounded-[0.8rem] border border-slate-950/10 bg-white pl-11 pr-4 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  placeholder="tu@email.com"
                  type="email"
                  {...register("email")}
                />
              </span>
              {errors.email ? (
                <span className="text-xs text-danger">{errors.email.message}</span>
              ) : null}
            </label>

            <label className="grid gap-1.5 text-sm font-bold text-slate-950">
              Contraseña
              <span className="relative">
                <LockKeyhole
                  aria-hidden="true"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  className="min-h-11 w-full rounded-[0.8rem] border border-slate-950/10 bg-white pl-11 pr-12 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
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
                <label className="grid gap-1.5 text-sm font-bold text-slate-950">
                  Confirmar contraseña
                  <span className="relative">
                    <LockKeyhole
                      aria-hidden="true"
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      className="min-h-11 w-full rounded-[0.8rem] border border-slate-950/10 bg-white pl-11 pr-4 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                      placeholder="Repite tu contraseña"
                      type="password"
                      {...register("confirmPassword")}
                    />
                  </span>
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
              className="min-h-12 w-full rounded-[0.85rem] text-base font-black shadow-[0_14px_34px_rgba(124,58,237,0.2)]"
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

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {authTrustItems.map((item) => {
              const Icon = item.icon;

              return (
                <div className="flex items-start gap-3" key={item.title}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500">
                    <Icon aria-hidden="true" size={17} />
                  </span>
                  <span>
                    <span className="block text-xs font-black text-slate-950">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">
                      {item.description}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-center text-sm text-slate-600 lg:hidden">
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
