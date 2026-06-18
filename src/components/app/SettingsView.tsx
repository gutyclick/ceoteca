"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  Globe2,
  HelpCircle,
  Home,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { plans, type PlanKey } from "@/config/plans";
import { siteConfig } from "@/config/site";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

type SettingsSectionKey =
  | "profile"
  | "security"
  | "billing"
  | "notifications"
  | "learning"
  | "locale"
  | "privacy"
  | "support";

type SettingsItem = {
  key: SettingsSectionKey;
  title: string;
  description: string;
  icon: LucideIcon;
  tone?: "purple" | "cyan" | "blue" | "danger";
};

type AccountForm = {
  fullName: string;
  email: string;
  birthDate: string;
  plan: PlanKey;
};

type MfaSetup = {
  factorId: string;
  challengeId: string;
  qrCode: string;
  secret: string;
};

const navItems = [
  { label: "Inicio", href: "/home", icon: Home, active: false },
  { label: "Biblioteca", href: "/biblioteca", icon: BookOpen, active: false },
  { label: "IA", href: "/home#ia", icon: Bot, active: false },
  { label: "Perfil", href: "/perfil", icon: User, active: false },
  { label: "Configuracion", href: "/configuracion", icon: Settings, active: true },
] as const;

const settingsItems: SettingsItem[] = [
  {
    key: "profile",
    title: "Perfil",
    description: "Nombre, correo y datos personales",
    icon: User,
  },
  {
    key: "security",
    title: "Seguridad",
    description: "Contrasena, 2FA y privacidad de acceso",
    icon: ShieldCheck,
  },
  {
    key: "billing",
    title: "Suscripcion y pagos",
    description: "Plan actual, metodo de pago y facturas",
    icon: CreditCard,
  },
  {
    key: "notifications",
    title: "Notificaciones",
    description: "Recordatorios, correo y actividad",
    icon: Bell,
  },
  {
    key: "learning",
    title: "Preferencias de aprendizaje",
    description: "Audio, IA, dificultad y recomendaciones",
    icon: SlidersHorizontal,
  },
  {
    key: "locale",
    title: "Idioma y region",
    description: "Idioma, zona horaria y moneda",
    icon: Globe2,
  },
  {
    key: "privacy",
    title: "Datos y privacidad",
    description: "Exporta o elimina tu informacion",
    icon: Download,
    tone: "cyan",
  },
  {
    key: "support",
    title: "Ayuda y soporte",
    description: "Centro de ayuda y contacto",
    icon: HelpCircle,
    tone: "blue",
  },
];

function BottomNavigation() {
  return (
    <nav className="fixed bottom-4 left-1/2 z-40 w-[min(94vw,1120px)] -translate-x-1/2 rounded-[24px] border border-white/10 bg-[#080915]/92 px-4 py-3 shadow-ambient backdrop-blur-xl">
      <div className="grid grid-cols-5 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isCenter = item.label === "IA";

          return (
            <Link
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-button px-2 py-2 text-xs text-text-secondary transition hover:text-white md:flex-row md:text-base",
                item.active && "text-brand-purple",
                isCenter &&
                  "-mt-10 mx-auto h-[74px] w-[74px] rounded-full border border-brand-purple/70 bg-brand-purple/20 text-brand-purple shadow-[0_0_45px_rgba(124,58,237,0.55)] md:flex-col md:text-sm",
              )}
              href={item.href}
              key={item.label}
            >
              <Icon aria-hidden="true" size={isCenter ? 27 : 24} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
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
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-text-secondary">{label}</span>
      {children}
      {hint ? <span className="text-xs leading-5 text-text-muted">{hint}</span> : null}
    </label>
  );
}

function Toggle({
  label,
  description,
  enabled,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[12px] border border-white/10 bg-white/[0.025] p-3.5">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-sm leading-6 text-text-secondary">{description}</p>
      </div>
      <button
        aria-pressed={enabled}
        className={cn(
          "h-7 w-12 rounded-full border p-1 transition disabled:cursor-not-allowed disabled:opacity-60",
          enabled
            ? "border-brand-purple/50 bg-brand-purple/35"
            : "border-white/10 bg-white/[0.04]",
        )}
        disabled={disabled}
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
        "rounded-card border p-3 text-sm leading-6",
        type === "success" && "border-success/30 bg-success/10 text-success",
        type === "error" && "border-danger/30 bg-danger/10 text-danger",
        type === "info" && "border-brand-purple/30 bg-brand-purple/10 text-brand-purple",
      )}
    >
      {message}
    </div>
  );
}

function SettingsRow({
  item,
  active,
  onClick,
}: {
  item: SettingsItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  const iconClass = {
    purple: "bg-brand-purple/15 text-brand-purple border-brand-purple/20",
    cyan: "bg-cyan-400/12 text-cyan-300 border-cyan-300/20",
    blue: "bg-blue-400/12 text-blue-300 border-blue-300/20",
    danger: "bg-danger/12 text-danger border-danger/25",
  }[item.tone ?? "purple"];

  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 rounded-[12px] border px-3 py-3 text-left transition",
        active
          ? "border-brand-purple/55 bg-brand-purple/15 text-white"
          : "border-transparent hover:border-white/10 hover:bg-white/[0.035] hover:text-brand-purple",
      )}
      onClick={onClick}
      type="button"
    >
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border",
          iconClass,
        )}
      >
        <Icon aria-hidden="true" size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{item.title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-text-secondary">
          {item.description}
        </span>
      </span>
      <ChevronRight aria-hidden="true" className="text-text-secondary" size={17} />
    </button>
  );
}

export function SettingsView() {
  const router = useRouter();
  const [activeSection, setActiveSection] =
    useState<SettingsSectionKey>("profile");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
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
  const [notifications, setNotifications] = useState({
    reminders: true,
    weeklySummary: false,
    productNews: false,
  });
  const [learning, setLearning] = useState({
    preferAudio: true,
    aiRecommendations: true,
    compactCards: false,
  });
  const [locale, setLocale] = useState({
    language: "es",
    timezone: "America/Panama",
    currency: "USD",
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

        const { data, error } = await supabase
          .from("profiles")
          .select("full_name,birth_date,plan")
          .eq("id", userData.user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (isMounted) {
          setAccountForm({
            fullName: data?.full_name ?? "",
            email: userData.user.email ?? "",
            birthDate: data?.birth_date ?? "",
            plan: data?.plan ?? "free",
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
        throw new Error("Escribe un correo valido.");
      }

      if (!isDemo) {
        const supabase = createBrowserSupabaseClient();
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        const currentEmail = userData.user?.email ?? "";

        if (!userId) {
          throw new Error("Inicia sesion para guardar cambios.");
        }

        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update({
            full_name: accountForm.fullName.trim() || null,
            birth_date: accountForm.birthDate || null,
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
            "Perfil guardado. Revisa tu correo para confirmar el cambio de email.",
          );
        } else {
          setProfileMessage("Perfil actualizado correctamente.");
        }
      } else {
        setProfileMessage("Perfil actualizado en modo demo.");
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
        throw new Error("La contrasena debe tener al menos 8 caracteres.");
      }

      if (passwordForm.password !== passwordForm.confirmPassword) {
        throw new Error("Las contrasenas no coinciden.");
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
      setSecurityMessage("Contrasena actualizada correctamente.");
    } catch (caughtError) {
      setSecurityError(
        caughtError instanceof Error
          ? caughtError.message
          : "No pudimos actualizar la contrasena.",
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
        throw new Error("El 2FA requiere Supabase Auth activo.");
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
      setSecurityMessage("Autenticacion en dos pasos activada.");
    } catch (caughtError) {
      setSecurityError(
        caughtError instanceof Error
          ? caughtError.message
          : "No pudimos verificar el codigo 2FA.",
      );
    } finally {
      setIsMfaLoading(false);
    }
  }

  async function signOut() {
    setIsSigningOut(true);
    setSignOutError(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      router.push("/login");
      router.refresh();
    } catch (caughtError) {
      setSignOutError(
        caughtError instanceof Error
          ? caughtError.message
          : "No pudimos cerrar la sesion.",
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  function downloadAccountData() {
    const payload = {
      profile: accountForm,
      preferences: {
        notifications,
        learning,
        locale,
      },
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

  const selectedItem =
    settingsItems.find((item) => item.key === activeSection) ?? settingsItems[0];
  const SelectedIcon = selectedItem.icon;

  return (
    <main className="min-h-screen overflow-hidden bg-[#03040b] pb-36 text-text-primary">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(124,58,237,0.18),transparent_28%),radial-gradient(circle_at_76%_18%,rgba(79,99,255,0.12),transparent_30%),linear-gradient(180deg,#02030a_0%,#050612_52%,#04040a_100%)]" />

      <section className="mx-auto w-full max-w-[1280px] px-5 pt-7 md:px-8">
        <header className="flex items-center justify-between">
          <Logo className="[&>span]:text-[15px] [&>span]:tracking-[0.34em]" />
          <button
            aria-label="Notificaciones"
            className="relative grid h-10 w-10 place-items-center rounded-full text-white transition hover:bg-white/[0.06]"
            type="button"
          >
            <Bell aria-hidden="true" size={21} />
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-brand-purple ring-2 ring-[#03040b]" />
          </button>
        </header>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-center">
          <div className="flex items-start gap-5">
            <button
              aria-label="Volver"
              className="mt-2 grid h-11 w-11 place-items-center rounded-button border border-white/10 bg-white/[0.035] text-brand-purple transition hover:text-white"
              onClick={() => router.back()}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={24} />
            </button>
            <div>
              <h1 className="text-4xl font-semibold md:text-5xl">Ajustes</h1>
              <p className="mt-3 text-base text-text-secondary md:text-lg">
                Administra tu cuenta y preferencias
              </p>
            </div>
          </div>

          <div className="relative hidden min-h-36 lg:block">
            <div className="absolute right-12 top-6 h-20 w-20 rotate-12 rounded-[22px] bg-brand-gradient shadow-[0_0_45px_rgba(124,58,237,0.48)]" />
            <div className="absolute right-0 top-12 h-20 w-48 rounded-[22px] border border-white/10 bg-white/[0.055]" />
            <div className="absolute right-12 top-16 h-5 w-20 rounded-full bg-black/50">
              <span className="ml-auto block h-5 w-5 rounded-full bg-brand-purple" />
            </div>
            <Settings
              aria-hidden="true"
              className="absolute right-[86px] top-9 text-white drop-shadow-[0_0_20px_rgba(124,58,237,0.65)]"
              size={66}
            />
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr]">
          <Card className="h-fit rounded-[18px] bg-white/[0.035] p-3 lg:sticky lg:top-6">
            <nav aria-label="Secciones de configuracion" className="grid gap-1.5">
              {settingsItems.map((item) => (
                <SettingsRow
                  active={activeSection === item.key}
                  item={item}
                  key={item.key}
                  onClick={() => setActiveSection(item.key)}
                />
              ))}
            </nav>
          </Card>

          <Card className="rounded-[18px] bg-white/[0.035] p-5 md:p-6">
            <div className="flex items-start gap-3 border-b border-white/10 pb-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] border border-brand-purple/25 bg-brand-purple/15 text-brand-purple">
                <SelectedIcon aria-hidden="true" size={21} />
              </span>
              <div>
                <h2 className="text-2xl font-semibold">{selectedItem.title}</h2>
                <p className="mt-1 text-sm leading-6 text-text-secondary">
                  {selectedItem.description}
                </p>
              </div>
            </div>

            <div className="mt-6">
              {activeSection === "profile" ? (
                <section className="grid gap-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Nombre">
                      <input
                        className="min-h-12 rounded-button border border-white/10 bg-white/[0.035] px-4 outline-none transition focus:border-brand-purple/60"
                        disabled={isLoadingAccount}
                        onChange={(event) =>
                          setAccountForm((current) => ({
                            ...current,
                            fullName: event.target.value,
                          }))
                        }
                        value={accountForm.fullName}
                      />
                    </Field>
                    <Field
                      hint="Si cambias el correo, Supabase enviara confirmacion."
                      label="Correo"
                    >
                      <input
                        className="min-h-12 rounded-button border border-white/10 bg-white/[0.035] px-4 outline-none transition focus:border-brand-purple/60"
                        disabled={isLoadingAccount}
                        onChange={(event) =>
                          setAccountForm((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                        type="email"
                        value={accountForm.email}
                      />
                    </Field>
                    <Field
                      hint="Opcional. Solo se usa para personalizar tu experiencia."
                      label="Fecha de nacimiento"
                    >
                      <input
                        className="min-h-12 rounded-button border border-white/10 bg-white/[0.035] px-4 outline-none transition focus:border-brand-purple/60"
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
                    <Field label="Plan actual">
                      <input
                        className="min-h-12 rounded-button border border-white/10 bg-white/[0.035] px-4 text-text-secondary outline-none"
                        readOnly
                        value={plans[accountForm.plan].name}
                      />
                    </Field>
                  </div>
                  <StatusMessage message={profileMessage} type="success" />
                  <StatusMessage message={profileError} type="error" />
                  <button
                    className="inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-button bg-brand-gradient px-5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
                    disabled={isSavingProfile || isLoadingAccount}
                    onClick={() => void saveProfile()}
                    type="button"
                  >
                    {isSavingProfile ? (
                      <Loader2 aria-hidden="true" className="animate-spin" size={18} />
                    ) : (
                      <CheckCircle2 aria-hidden="true" size={18} />
                    )}
                    Guardar perfil
                  </button>
                </section>
              ) : null}

              {activeSection === "security" ? (
                <section className="grid gap-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Nueva contrasena">
                      <input
                        className="min-h-12 rounded-button border border-white/10 bg-white/[0.035] px-4 outline-none transition focus:border-brand-purple/60"
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
                    <Field label="Confirmar contrasena">
                      <input
                        className="min-h-12 rounded-button border border-white/10 bg-white/[0.035] px-4 outline-none transition focus:border-brand-purple/60"
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
                    className="inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-button bg-brand-gradient px-5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
                    disabled={isSavingPassword}
                    onClick={() => void savePassword()}
                    type="button"
                  >
                    <KeyRound aria-hidden="true" size={18} />
                    Actualizar contrasena
                  </button>

                  <div className="rounded-[14px] border border-white/10 bg-white/[0.025] p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          Autenticacion en dos pasos
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-text-secondary">
                          Protege tu cuenta con una app autenticadora compatible
                          con TOTP.
                        </p>
                      </div>
                      <button
                        className="inline-flex min-h-11 items-center justify-center rounded-button border border-brand-purple/40 bg-brand-purple/15 px-4 text-sm text-brand-purple transition hover:border-brand-purple"
                        disabled={isMfaLoading}
                        onClick={() => void startMfaEnrollment()}
                        type="button"
                      >
                        Activar 2FA
                      </button>
                    </div>

                    {mfaSetup ? (
                      <div className="mt-5 grid gap-5 md:grid-cols-[180px_1fr]">
                        <div className="rounded-card bg-white p-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            alt="Codigo QR para activar 2FA"
                            className="h-full w-full"
                            src={mfaSetup.qrCode}
                          />
                        </div>
                        <div className="grid gap-3">
                          <p className="text-sm leading-6 text-text-secondary">
                            Escanea el QR o usa este secreto:
                          </p>
                          <code className="rounded-card border border-white/10 bg-white/[0.035] p-3 text-sm text-brand-purple">
                            {mfaSetup.secret}
                          </code>
                          <Field label="Codigo de 6 digitos">
                            <input
                              className="min-h-12 rounded-button border border-white/10 bg-white/[0.035] px-4 outline-none transition focus:border-brand-purple/60"
                              inputMode="numeric"
                              maxLength={6}
                              onChange={(event) => setMfaCode(event.target.value)}
                              value={mfaCode}
                            />
                          </Field>
                          <button
                            className="inline-flex min-h-11 w-fit items-center justify-center rounded-button bg-brand-gradient px-4 text-sm font-medium text-white"
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
                  <StatusMessage message={securityMessage} type="success" />
                  <StatusMessage message={securityError} type="error" />
                </section>
              ) : null}

              {activeSection === "billing" ? (
                <section className="grid gap-5">
                  <div className="rounded-card border border-brand-purple/35 bg-brand-purple/10 p-5">
                    <p className="text-sm text-text-secondary">Plan actual</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {plans[accountForm.plan].name}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-text-secondary">
                      {plans[accountForm.plan].description}
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Link
                      className="flex min-h-14 items-center justify-center rounded-button bg-brand-gradient px-5 text-sm font-medium text-white"
                      href="/planes"
                    >
                      Cambiar plan
                    </Link>
                    <button
                      className="min-h-14 rounded-button border border-white/10 bg-white/[0.035] px-5 text-sm text-text-muted"
                      disabled
                      type="button"
                    >
                      Metodo de pago pendiente de pasarela
                    </button>
                  </div>
                  <div className="rounded-card border border-dashed border-white/15 bg-white/[0.025] p-5 text-sm leading-6 text-text-secondary">
                    Todavia no hay facturas porque la pasarela de pagos no esta
                    integrada.
                  </div>
                </section>
              ) : null}

              {activeSection === "notifications" ? (
                <section className="grid gap-3">
                  <Toggle
                    description="Avisos para continuar libros pendientes."
                    enabled={notifications.reminders}
                    label="Recordatorios de aprendizaje"
                    onChange={() =>
                      setNotifications((current) => ({
                        ...current,
                        reminders: !current.reminders,
                      }))
                    }
                  />
                  <Toggle
                    description="Resumen semanal con progreso, logros y recomendaciones."
                    enabled={notifications.weeklySummary}
                    label="Resumen semanal por correo"
                    onChange={() =>
                      setNotifications((current) => ({
                        ...current,
                        weeklySummary: !current.weeklySummary,
                      }))
                    }
                  />
                  <Toggle
                    description="Novedades de producto y nuevas colecciones."
                    enabled={notifications.productNews}
                    label="Novedades de Ceoteca"
                    onChange={() =>
                      setNotifications((current) => ({
                        ...current,
                        productNews: !current.productNews,
                      }))
                    }
                  />
                </section>
              ) : null}

              {activeSection === "learning" ? (
                <section className="grid gap-3">
                  <Toggle
                    description="Prioriza contenido con audio cuando este disponible."
                    enabled={learning.preferAudio}
                    label="Preferir experiencias con audio"
                    onChange={() =>
                      setLearning((current) => ({
                        ...current,
                        preferAudio: !current.preferAudio,
                      }))
                    }
                  />
                  <Toggle
                    description="Ordena recomendaciones segun tu progreso y preguntas."
                    enabled={learning.aiRecommendations}
                    label="Recomendaciones con IA"
                    onChange={() =>
                      setLearning((current) => ({
                        ...current,
                        aiRecommendations: !current.aiRecommendations,
                      }))
                    }
                  />
                  <Toggle
                    description="Reduce densidad visual en tarjetas de biblioteca."
                    enabled={learning.compactCards}
                    label="Vista compacta"
                    onChange={() =>
                      setLearning((current) => ({
                        ...current,
                        compactCards: !current.compactCards,
                      }))
                    }
                  />
                </section>
              ) : null}

              {activeSection === "locale" ? (
                <section className="grid gap-4 md:grid-cols-3">
                  <Field label="Idioma">
                    <select
                      className="min-h-12 rounded-button border border-white/10 bg-[#0b0c18] px-4 outline-none"
                      onChange={(event) =>
                        setLocale((current) => ({
                          ...current,
                          language: event.target.value,
                        }))
                      }
                      value={locale.language}
                    >
                      <option value="es">Espanol</option>
                      <option value="en">English</option>
                    </select>
                  </Field>
                  <Field label="Zona horaria">
                    <select
                      className="min-h-12 rounded-button border border-white/10 bg-[#0b0c18] px-4 outline-none"
                      onChange={(event) =>
                        setLocale((current) => ({
                          ...current,
                          timezone: event.target.value,
                        }))
                      }
                      value={locale.timezone}
                    >
                      <option value="America/Panama">America/Panama</option>
                      <option value="America/Bogota">America/Bogota</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="Europe/Madrid">Europe/Madrid</option>
                    </select>
                  </Field>
                  <Field label="Moneda">
                    <select
                      className="min-h-12 rounded-button border border-white/10 bg-[#0b0c18] px-4 outline-none"
                      onChange={(event) =>
                        setLocale((current) => ({
                          ...current,
                          currency: event.target.value,
                        }))
                      }
                      value={locale.currency}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="COP">COP</option>
                    </select>
                  </Field>
                </section>
              ) : null}

              {activeSection === "privacy" ? (
                <section className="grid gap-4">
                  <button
                    className="flex min-h-14 w-fit items-center gap-2 rounded-button border border-cyan-300/25 bg-cyan-300/10 px-5 text-sm text-cyan-300"
                    onClick={downloadAccountData}
                    type="button"
                  >
                    <Download aria-hidden="true" size={18} />
                    Exportar mis datos
                  </button>
                  <div className="rounded-card border border-danger/25 bg-danger/10 p-5">
                    <div className="flex gap-4">
                      <Trash2 aria-hidden="true" className="mt-1 text-danger" size={22} />
                      <div>
                        <h3 className="font-semibold text-danger">
                          Eliminar cuenta
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-text-secondary">
                          Esta accion requiere un flujo de confirmacion y backend
                          administrativo. No esta habilitada para evitar
                          eliminaciones accidentales.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

              {activeSection === "support" ? (
                <section className="grid gap-4">
                  <Link
                    className="flex min-h-14 w-fit items-center gap-2 rounded-button bg-brand-gradient px-5 text-sm font-medium text-white"
                    href={`mailto:${siteConfig.supportEmail}`}
                  >
                    <Mail aria-hidden="true" size={18} />
                    Contactar soporte
                  </Link>
                  <div className="rounded-card border border-white/10 bg-white/[0.025] p-5 text-sm leading-6 text-text-secondary">
                    Correo de soporte: {siteConfig.supportEmail}
                  </div>
                </section>
              ) : null}
            </div>
          </Card>
        </section>

        <Card className="mt-5 rounded-[18px] bg-white/[0.035] p-5 md:p-6">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-text-muted">
            Cuenta
          </p>
          <button
            className="mt-4 flex w-full items-center gap-4 rounded-card p-3 text-left text-danger transition hover:bg-danger/5"
            disabled={isSigningOut}
            onClick={() => void signOut()}
            type="button"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] border border-danger/25 bg-danger/12 text-danger">
              <LogOut aria-hidden="true" size={22} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold">
                {isSigningOut ? "Cerrando sesion..." : "Cerrar sesion"}
              </span>
              <span className="mt-1 block text-sm text-text-secondary">
                Sal de tu cuenta de Ceoteca
              </span>
            </span>
            <ChevronRight aria-hidden="true" size={20} />
          </button>
          {signOutError ? (
            <div className="mt-5 rounded-card border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              {signOutError}
            </div>
          ) : null}
        </Card>

        <footer className="mt-10 border-t border-white/10 py-8 text-sm text-text-muted">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p>© 2026 Ceoteca. Todos los derechos reservados.</p>
            <nav
              aria-label="Legal de configuracion"
              className="flex flex-wrap gap-x-5 gap-y-2"
            >
              <Link className="transition hover:text-text-primary" href="/terminos">
                Terminos
              </Link>
              <Link
                className="transition hover:text-text-primary"
                href="/privacidad"
              >
                Privacidad
              </Link>
              <Link
                className="transition hover:text-text-primary"
                href={`mailto:${siteConfig.supportEmail}`}
              >
                Soporte
              </Link>
            </nav>
          </div>
        </footer>
      </section>

      <BottomNavigation />
    </main>
  );
}
