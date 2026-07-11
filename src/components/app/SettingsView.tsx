"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Download,
  Flame,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Trophy,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { DashboardSidebar } from "@/components/app/DashboardSidebar";
import { DashboardAccountMenu } from "@/components/app/DashboardAccountMenu";
import { NotificationBell } from "@/components/app/NotificationBell";
import { plans, type PlanKey } from "@/config/plans";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { resolvePlanFromSubscriptions } from "@/lib/subscriptions/resolve";
import { cn } from "@/lib/utils/cn";

type SettingsSectionKey =
  | "profile"
  | "preferences"
  | "security"
  | "billing"
  | "privacy";

type SettingsItem = {
  key: SettingsSectionKey;
  title: string;
  description: string;
  icon: LucideIcon;
};

type AccountForm = {
  fullName: string;
  email: string;
  birthDate: string;
  plan: PlanKey;
  avatarUrl: string | null;
};

type MfaSetup = {
  factorId: string;
  challengeId: string;
  qrCode: string;
  secret: string;
};

const settingsItems: SettingsItem[] = [
  {
    key: "profile",
    title: "Mi cuenta",
    description: "Información personal y perfil",
    icon: User,
  },
  {
    key: "preferences",
    title: "Preferencias",
    description: "Lectura, idioma y experiencia",
    icon: SlidersHorizontal,
  },
  {
    key: "security",
    title: "Seguridad",
    description: "Contraseña y verificación",
    icon: ShieldCheck,
  },
  {
    key: "billing",
    title: "Suscripción",
    description: "Plan, pagos y comprobantes",
    icon: CreditCard,
  },
  {
    key: "privacy",
    title: "Datos y privacidad",
    description: "Exportación y control de datos",
    icon: Download,
  },
];

const avatarOptions = [
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=320&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=320&q=80",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=320&q=80",
  "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=320&q=80",
] as const;

function getInitials(name: string, email: string) {
  const source = name.trim().length > 0 ? name : email;
  const parts = source.split(/[ @._-]+/).filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part.at(0)?.toUpperCase() ?? "")
    .join("");
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-950">
      {label}
      {children}
      {hint ? <span className="text-xs leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}

function InputShell({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <span className="relative block">
      <Icon
        aria-hidden="true"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        size={18}
      />
      {children}
    </span>
  );
}

function StatusMessage({
  type,
  message,
}: {
  type: "success" | "error" | "info";
  message: string | null;
}) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-[14px] border px-4 py-3 text-sm leading-6",
        type === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        type === "error" && "border-red-200 bg-red-50 text-red-700",
        type === "info" && "border-violet-200 bg-violet-50 text-violet-700",
      )}
    >
      {message}
    </div>
  );
}

function Toggle({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[16px] border border-slate-950/[0.08] bg-white p-4">
      <div>
        <p className="text-sm font-black text-slate-950">{label}</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <button
        aria-pressed={enabled}
        className={cn(
          "h-7 w-12 rounded-full border p-1 transition",
          enabled
            ? "border-violet-500 bg-violet-600"
            : "border-slate-200 bg-slate-100",
        )}
        onClick={onChange}
        type="button"
      >
        <span
          className={cn(
            "block h-5 w-5 rounded-full bg-white transition",
            enabled && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}

function MetricRow({
  icon: Icon,
  title,
  value,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-slate-950/[0.06] py-4 last:border-b-0">
      <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-violet-50 text-violet-700">
        <Icon aria-hidden="true" size={23} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-slate-950">{title}</span>
        <span className="mt-1 block text-sm text-slate-500">{value}</span>
      </span>
      <ChevronRight aria-hidden="true" className="text-slate-400" size={18} />
    </div>
  );
}

export function SettingsView() {
  const router = useRouter();
  const [activeSection, setActiveSection] =
    useState<SettingsSectionKey>("profile");
  const [isDemo, setIsDemo] = useState(false);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState<AccountForm>({
    fullName: "",
    email: "",
    birthDate: "",
    plan: "free",
    avatarUrl: null,
  });
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [mfaSetup, setMfaSetup] = useState<MfaSetup | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [isMfaLoading, setIsMfaLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    reminders: true,
    weeklySummary: false,
    productNews: false,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadAccount() {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          router.push("/login");
          return;
        }

        const [profileResponse, subscriptionResponse] = await Promise.all([
          supabase
            .from("profiles")
            .select("full_name,birth_date,plan,avatar_url")
            .eq("id", userData.user.id)
            .maybeSingle(),
          supabase
            .from("subscriptions")
            .select("plan,status,updated_at")
            .eq("user_id", userData.user.id)
            .order("updated_at", { ascending: false }),
        ]);

        if (profileResponse.error) {
          throw profileResponse.error;
        }

        if (subscriptionResponse.error) {
          throw subscriptionResponse.error;
        }

        const data = profileResponse.data;
        const effectivePlan = resolvePlanFromSubscriptions({
          profilePlan: data?.plan ?? "free",
          subscriptions: subscriptionResponse.data ?? [],
        }).plan;

        if (isMounted) {
          setAccountForm({
            fullName: data?.full_name ?? "",
            email: userData.user.email ?? "",
            birthDate: data?.birth_date ?? "",
            plan: effectivePlan,
            avatarUrl: data?.avatar_url ?? null,
          });
        }
      } catch {
        if (isMounted) {
          setIsDemo(true);
          setAccountForm({
            fullName: "Usuario Ceoteca",
            email: "usuario@ceoteca.com",
            birthDate: "",
            plan: "free",
            avatarUrl: avatarOptions[0],
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingAccount(false);
        }
      }
    }

    void loadAccount();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function saveProfile() {
    setProfileError(null);
    setProfileMessage(null);
    setIsSavingProfile(true);

    try {
      if (!accountForm.email.includes("@")) {
        throw new Error("Escribe un correo válido.");
      }

      if (!isDemo) {
        const supabase = createBrowserSupabaseClient();
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        const currentEmail = userData.user?.email ?? "";

        if (!userId) {
          throw new Error("Inicia sesión para guardar cambios.");
        }

        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update({
            full_name: accountForm.fullName.trim() || null,
            birth_date: accountForm.birthDate || null,
            avatar_url: accountForm.avatarUrl,
          })
          .eq("id", userId);

        if (profileUpdateError) {
          throw profileUpdateError;
        }

        if (accountForm.email !== currentEmail) {
          const { error: emailUpdateError } = await supabase.auth.updateUser({
            email: accountForm.email,
          });

          if (emailUpdateError) {
            throw emailUpdateError;
          }

          setProfileMessage(
            "Datos guardados. Revisa tu nuevo correo para confirmar el cambio.",
          );
        } else {
          setProfileMessage("Perfil actualizado correctamente.");
        }
      } else {
        setProfileMessage("Perfil actualizado para esta sesión.");
      }
    } catch (caughtError) {
      setProfileError(
        caughtError instanceof Error
          ? caughtError.message
          : "No pudimos guardar el perfil.",
      );
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function savePassword() {
    setSecurityError(null);
    setSecurityMessage(null);

    try {
      if (passwordForm.password.length < 8) {
        throw new Error("La nueva contraseña debe tener al menos 8 caracteres.");
      }

      if (passwordForm.password !== passwordForm.confirmPassword) {
        throw new Error("Las contraseñas no coinciden. Revisa ambos campos.");
      }

      setIsSavingPassword(true);

      if (!isDemo) {
        const supabase = createBrowserSupabaseClient();
        const { error } = await supabase.auth.updateUser({
          password: passwordForm.password,
        });

        if (error) {
          throw error;
        }
      }

      setPasswordForm({ password: "", confirmPassword: "" });
      setSecurityMessage("Tu contraseña fue actualizada correctamente.");
    } catch (caughtError) {
      setSecurityError(
        caughtError instanceof Error
          ? caughtError.message
          : "No pudimos actualizar la contraseña en este momento.",
      );
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function startMfaEnrollment() {
    setSecurityError(null);
    setSecurityMessage(null);
    setIsMfaLoading(true);

    try {
      if (isDemo) {
        throw new Error("La autenticación en dos pasos requiere una cuenta activa.");
      }

      const supabase = createBrowserSupabaseClient();
      const { data: enrollData, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Ceoteca",
      });

      if (enrollError) {
        throw enrollError;
      }

      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: enrollData.id });

      if (challengeError) {
        throw challengeError;
      }

      setMfaSetup({
        factorId: enrollData.id,
        challengeId: challengeData.id,
        qrCode: enrollData.totp.qr_code,
        secret: enrollData.totp.secret,
      });
    } catch (caughtError) {
      setSecurityError(
        caughtError instanceof Error
          ? caughtError.message
          : "No pudimos iniciar 2FA.",
      );
    } finally {
      setIsMfaLoading(false);
    }
  }

  async function verifyMfa() {
    if (!mfaSetup) {
      return;
    }

    setSecurityError(null);
    setSecurityMessage(null);
    setIsMfaLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.mfa.verify({
        factorId: mfaSetup.factorId,
        challengeId: mfaSetup.challengeId,
        code: mfaCode,
      });

      if (error) {
        throw error;
      }

      setMfaSetup(null);
      setMfaCode("");
      setSecurityMessage("La autenticación en dos pasos quedó activada.");
    } catch (caughtError) {
      setSecurityError(
        caughtError instanceof Error
          ? caughtError.message
          : "No pudimos verificar el código 2FA.",
      );
    } finally {
      setIsMfaLoading(false);
    }
  }

  function downloadAccountData() {
    const payload = {
      profile: accountForm,
      preferences,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ceoteca-datos.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  const initials = getInitials(accountForm.fullName, accountForm.email);
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbfaf8] pb-12 pl-0 text-slate-950 transition-[padding] duration-300 ease-out sm:pl-[var(--dashboard-sidebar-offset,240px)]">
      <DashboardSidebar active="settings" tone="light" />

      <section className="mx-auto w-full max-w-[1380px] px-5 pt-8 sm:px-7 lg:px-10">
        <header className="flex items-start justify-between gap-5 border-b border-slate-950/[0.08] pb-6">
          <div>
            <h1 className="text-4xl font-black tracking-[-0.04em] text-slate-950">
              Ajustes
            </h1>
            <p className="mt-2 text-base text-slate-600">
              Administra tu cuenta, preferencias y seguridad.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell tone="light" />
            <DashboardAccountMenu
              avatarUrl={accountForm.avatarUrl}
              fullName={accountForm.fullName}
            />
          </div>
        </header>

        <nav
          aria-label="Secciones de ajustes"
          className="mt-8 flex gap-8 overflow-x-auto border-b border-slate-950/[0.08]"
        >
          {settingsItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                className={cn(
                  "inline-flex min-h-14 shrink-0 items-center gap-2 border-b-2 px-1 text-sm font-black transition",
                  activeSection === item.key
                    ? "border-violet-600 text-violet-700"
                    : "border-transparent text-slate-600 hover:text-violet-700",
                )}
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                type="button"
              >
                <Icon aria-hidden="true" size={19} />
                {item.title}
              </button>
            );
          })}
        </nav>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-6">
            {activeSection === "profile" ? (
              <>
                <section className="rounded-[18px] border border-slate-950/[0.08] bg-white p-6">
                  <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_260px]">
                    <div>
                      <h2 className="text-xl font-black text-slate-950">
                        Información personal
                      </h2>
                      <div className="mt-6 grid gap-4">
                        <Field label="Nombre completo">
                          <InputShell icon={User}>
                            <input
                              className="min-h-11 w-full rounded-[12px] border border-slate-950/[0.10] bg-white pl-12 pr-4 text-slate-800 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                              disabled={isLoadingAccount}
                              onChange={(event) =>
                                setAccountForm((current) => ({
                                  ...current,
                                  fullName: event.target.value,
                                }))
                              }
                              placeholder="Tu nombre"
                              value={accountForm.fullName}
                            />
                          </InputShell>
                        </Field>
                        <Field
                          hint="Si cambias tu correo, te enviaremos una verificación para proteger tu cuenta."
                          label="Correo electrónico"
                        >
                          <InputShell icon={Mail}>
                            <input
                              className="min-h-11 w-full rounded-[12px] border border-slate-950/[0.10] bg-white pl-12 pr-4 text-slate-800 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                              disabled={isLoadingAccount}
                              onChange={(event) =>
                                setAccountForm((current) => ({
                                  ...current,
                                  email: event.target.value,
                                }))
                              }
                              placeholder="tu@email.com"
                              type="email"
                              value={accountForm.email}
                            />
                          </InputShell>
                        </Field>
                        <Field label="Teléfono (opcional)">
                          <InputShell icon={Phone}>
                            <input
                              className="min-h-11 w-full rounded-[12px] border border-slate-950/[0.10] bg-white pl-12 pr-4 text-slate-800 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                              placeholder="+57 300 123 4567"
                              type="tel"
                            />
                          </InputShell>
                        </Field>
                        <Field
                          hint="Opcional. Lo usamos para mejorar recomendaciones y comunicaciones."
                          label="Fecha de nacimiento"
                        >
                          <input
                            className="min-h-11 w-full rounded-[12px] border border-slate-950/[0.10] bg-white px-4 text-slate-800 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                            disabled={isLoadingAccount}
                            onChange={(event) =>
                              setAccountForm((current) => ({
                                ...current,
                                birthDate: event.target.value,
                              }))
                            }
                            type="date"
                            value={accountForm.birthDate}
                          />
                        </Field>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="mx-auto grid h-28 w-28 place-items-center overflow-hidden rounded-full bg-violet-100 text-2xl font-black text-violet-700">
                        {accountForm.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt=""
                            className="h-full w-full object-cover"
                            src={accountForm.avatarUrl}
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <p className="mt-4 font-black text-slate-950">
                        Foto de perfil
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Elige una imagen prealojada.
                      </p>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {avatarOptions.slice(0, 6).map((avatarUrl) => (
                          <button
                            aria-label="Seleccionar imagen de perfil"
                            className={cn(
                              "aspect-square overflow-hidden rounded-full border bg-white",
                              accountForm.avatarUrl === avatarUrl
                                ? "border-violet-600"
                                : "border-slate-200",
                            )}
                            disabled={isLoadingAccount}
                            key={avatarUrl}
                            onClick={() =>
                              setAccountForm((current) => ({
                                ...current,
                                avatarUrl,
                              }))
                            }
                            type="button"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              alt=""
                              className="h-full w-full object-cover"
                              src={avatarUrl}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3">
                    <StatusMessage message={profileMessage} type="success" />
                    <StatusMessage message={profileError} type="error" />
                  </div>

                  <button
                    className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 text-sm font-black text-white transition hover:brightness-105 disabled:opacity-60"
                    disabled={isSavingProfile || isLoadingAccount}
                    onClick={() => void saveProfile()}
                    type="button"
                  >
                    {isSavingProfile ? (
                      <Loader2 aria-hidden="true" className="animate-spin" size={18} />
                    ) : (
                      <CheckCircle2 aria-hidden="true" size={18} />
                    )}
                    Guardar cambios
                  </button>
                </section>
              </>
            ) : null}

            {activeSection === "preferences" ? (
              <section className="rounded-[18px] border border-slate-950/[0.08] bg-white p-6">
                <h2 className="text-xl font-black text-slate-950">
                  Preferencias
                </h2>
                <div className="mt-6 grid gap-3">
                  <Toggle
                    description="Recibe avisos útiles para retomar análisis pendientes."
                    enabled={preferences.reminders}
                    label="Recordatorios de aprendizaje"
                    onChange={() =>
                      setPreferences((current) => ({
                        ...current,
                        reminders: !current.reminders,
                      }))
                    }
                  />
                  <Toggle
                    description="Recibe un resumen con progreso, logros y recomendaciones."
                    enabled={preferences.weeklySummary}
                    label="Resumen semanal"
                    onChange={() =>
                      setPreferences((current) => ({
                        ...current,
                        weeklySummary: !current.weeklySummary,
                      }))
                    }
                  />
                  <Toggle
                    description="Entérate de nuevas colecciones y mejoras importantes."
                    enabled={preferences.productNews}
                    label="Novedades de Ceoteca"
                    onChange={() =>
                      setPreferences((current) => ({
                        ...current,
                        productNews: !current.productNews,
                      }))
                    }
                  />
                </div>
              </section>
            ) : null}

            {activeSection === "security" ? (
              <section className="rounded-[18px] border border-slate-950/[0.08] bg-white p-6">
                <h2 className="text-xl font-black text-slate-950">Seguridad</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Field label="Nueva contraseña">
                    <input
                      className="min-h-11 rounded-[12px] border border-slate-950/[0.10] bg-white px-4 text-slate-800 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      type="password"
                      value={passwordForm.password}
                    />
                  </Field>
                  <Field label="Confirmar contraseña">
                    <input
                      className="min-h-11 rounded-[12px] border border-slate-950/[0.10] bg-white px-4 text-slate-800 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))
                      }
                      type="password"
                      value={passwordForm.confirmPassword}
                    />
                  </Field>
                </div>
                <button
                  className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 text-sm font-black text-white transition hover:brightness-105 disabled:opacity-60"
                  disabled={isSavingPassword}
                  onClick={() => void savePassword()}
                  type="button"
                >
                  <KeyRound aria-hidden="true" size={18} />
                  Guardar contraseña
                </button>

                <div className="mt-6 rounded-[16px] border border-slate-950/[0.08] bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-black text-slate-950">
                        Autenticación en dos pasos
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Refuerza el acceso a tu cuenta con un código temporal
                        desde tu app autenticadora.
                      </p>
                    </div>
                    <button
                      className="inline-flex min-h-11 items-center justify-center rounded-[12px] border border-violet-200 bg-white px-4 text-sm font-black text-violet-700 transition hover:bg-violet-50"
                      disabled={isMfaLoading}
                      onClick={() => void startMfaEnrollment()}
                      type="button"
                    >
                      Activar 2FA
                    </button>
                  </div>

                  {mfaSetup ? (
                    <div className="mt-5 grid gap-5 md:grid-cols-[180px_1fr]">
                      <div className="rounded-[14px] bg-white p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt="Código QR para activar 2FA"
                          className="h-full w-full"
                          src={mfaSetup.qrCode}
                        />
                      </div>
                      <div className="grid gap-3">
                        <p className="text-sm leading-6 text-slate-600">
                          Escanea el código QR o guarda la clave de respaldo:
                        </p>
                        <code className="rounded-[12px] border border-slate-950/[0.08] bg-white p-3 text-sm text-violet-700">
                          {mfaSetup.secret}
                        </code>
                        <Field label="Código de 6 dígitos">
                          <input
                            className="min-h-11 rounded-[12px] border border-slate-950/[0.10] bg-white px-4 text-slate-800 outline-none focus:border-violet-300"
                            inputMode="numeric"
                            maxLength={6}
                            onChange={(event) => setMfaCode(event.target.value)}
                            value={mfaCode}
                          />
                        </Field>
                        <button
                          className="inline-flex min-h-11 w-fit items-center justify-center rounded-[12px] bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 text-sm font-black text-white"
                          disabled={isMfaLoading || mfaCode.length < 6}
                          onClick={() => void verifyMfa()}
                          type="button"
                        >
                          Verificar y activar
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="mt-5 grid gap-3">
                  <StatusMessage message={securityMessage} type="success" />
                  <StatusMessage message={securityError} type="error" />
                </div>
              </section>
            ) : null}

            {activeSection === "billing" ? (
              <section className="rounded-[18px] border border-slate-950/[0.08] bg-white p-6">
                <h2 className="text-xl font-black text-slate-950">
                  Suscripción
                </h2>
                <div className="mt-6 rounded-[16px] border border-violet-100 bg-violet-50 p-5">
                  <p className="text-sm text-violet-700">Plan actual</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {plans[accountForm.plan].name}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {plans[accountForm.plan].description}
                  </p>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <Link
                    className="flex min-h-12 items-center justify-center rounded-[12px] bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 text-sm font-black text-white"
                    href="/planes"
                  >
                    Cambiar plan
                  </Link>
                  <button
                    className="min-h-12 rounded-[12px] border border-slate-950/[0.10] bg-white px-5 text-sm font-bold text-slate-500"
                    disabled
                    type="button"
                  >
                    Método de pago
                  </button>
                </div>
                <div className="mt-5 rounded-[16px] border border-dashed border-slate-950/[0.12] bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                  Tus facturas y comprobantes aparecerán aquí cuando tengas
                  movimientos de suscripción.
                </div>
              </section>
            ) : null}

            {activeSection === "privacy" ? (
              <section className="rounded-[18px] border border-slate-950/[0.08] bg-white p-6">
                <h2 className="text-xl font-black text-slate-950">
                  Datos y privacidad
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Controla tu información personal y descarga una copia de tus
                  datos cuando lo necesites.
                </p>
                <button
                  className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-[12px] border border-violet-200 bg-white px-5 text-sm font-black text-violet-700 transition hover:bg-violet-50"
                  onClick={downloadAccountData}
                  type="button"
                >
                  <Download aria-hidden="true" size={18} />
                  Exportar mis datos
                </button>
                <div className="mt-6 rounded-[16px] border border-red-200 bg-red-50 p-5">
                  <div className="flex gap-4">
                    <Trash2 aria-hidden="true" className="mt-1 text-red-600" size={22} />
                    <div>
                      <h3 className="font-black text-red-700">Eliminar cuenta</h3>
                      <p className="mt-2 text-sm leading-6 text-red-700/80">
                        Para proteger tu información, la eliminación de cuenta
                        requiere verificación adicional con soporte.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
          </div>

          <aside className="grid h-fit gap-5">
            <section className="rounded-[18px] border border-slate-950/[0.08] bg-white p-6">
              <h2 className="font-black text-slate-950">Resumen de tu cuenta</h2>
              <div className="mt-5">
                <MetricRow icon={BookOpen} title="Análisis iniciados" value="12 análisis" />
                <MetricRow icon={Clock3} title="Minutos de lectura" value="281 min esta semana" />
                <MetricRow icon={Flame} title="Días de racha" value="5 días" />
                <MetricRow icon={Trophy} title="Logros obtenidos" value="3 logros" />
              </div>
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}
