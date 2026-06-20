"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  HelpCircle,
  KeyRound,
  Loader2,
  Mail,
  Settings,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { DashboardSidebar } from "@/components/app/DashboardSidebar";
import { NotificationBell } from "@/components/app/NotificationBell";
import { Card } from "@/components/ui/Card";
import { plans, type PlanKey } from "@/config/plans";
import { siteConfig } from "@/config/site";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

type SettingsSectionKey =
  | "profile"
  | "security"
  | "billing"
  | "notifications"
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
    description: "Plan, pagos y comprobantes",
    icon: CreditCard,
  },
  {
    key: "notifications",
    title: "Notificaciones",
    description: "Recordatorios, correo y actividad",
    icon: Bell,
  },
  {
    key: "privacy",
    title: "Datos y privacidad",
    description: "Exportacion y control de datos",
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
  const [notifications, setNotifications] = useState({
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

        const { data, error } = await supabase
          .from("profiles")
          .select("full_name,birth_date,plan,avatar_url")
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
            "Datos guardados. Te enviaremos una verificacion al nuevo correo para completar el cambio.",
          );
        } else {
          setProfileMessage("Perfil actualizado correctamente.");
        }
      } else {
        setProfileMessage("Perfil actualizado para esta sesion.");
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
        throw new Error("La nueva contrasena debe tener al menos 8 caracteres.");
      }

      if (passwordForm.password !== passwordForm.confirmPassword) {
        throw new Error("Las contrasenas no coinciden. Revisa ambos campos.");
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
      setSecurityMessage("Tu contrasena fue actualizada correctamente.");
    } catch (caughtError) {
      setSecurityError(
        caughtError instanceof Error
          ? caughtError.message
          : "No pudimos actualizar la contrasena en este momento.",
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
        throw new Error("La autenticacion en dos pasos requiere una cuenta activa.");
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
      setSecurityMessage("La autenticacion en dos pasos quedo activada.");
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

  function downloadAccountData() {
    const payload = {
      profile: accountForm,
      preferences: {
        notifications,
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
  const initials = getInitials(accountForm.fullName, accountForm.email);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#03040b] pb-16 pl-[var(--dashboard-sidebar-offset,84px)] text-text-primary transition-[padding] duration-300 ease-out">
      <DashboardSidebar active="settings" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(124,58,237,0.18),transparent_28%),radial-gradient(circle_at_76%_18%,rgba(79,99,255,0.12),transparent_30%),linear-gradient(180deg,#02030a_0%,#050612_52%,#04040a_100%)]" />

      <section className="w-full max-w-[1500px] px-5 pt-4 md:px-8 xl:px-10">
        <header className="flex items-center justify-end">
          <NotificationBell />
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
                <section className="grid gap-6">
                  <div className="grid gap-6 rounded-[16px] border border-white/10 bg-white/[0.025] p-5 lg:grid-cols-[220px_1fr]">
                    <div>
                      <p className="text-sm font-medium text-text-secondary">
                        Imagen de perfil
                      </p>
                      <div className="mt-4 flex items-center gap-4 lg:block">
                        <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-[24px] border border-brand-purple/40 bg-brand-purple/15 text-2xl font-semibold text-white shadow-[0_0_38px_rgba(124,58,237,0.28)]">
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
                        <p className="max-w-xs text-sm leading-6 text-text-secondary lg:mt-4">
                          Elige una imagen preseleccionada para mantener una
                          experiencia visual cuidada y consistente.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                      {avatarOptions.map((avatarUrl) => (
                        <button
                          aria-label="Seleccionar imagen de perfil"
                          className={cn(
                            "aspect-square overflow-hidden rounded-[16px] border bg-white/[0.04] transition hover:-translate-y-0.5 hover:border-brand-purple/70",
                            accountForm.avatarUrl === avatarUrl
                              ? "border-brand-purple shadow-[0_0_24px_rgba(124,58,237,0.35)]"
                              : "border-white/10",
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

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Nombre completo">
                      <input
                        className="min-h-12 rounded-button border border-white/10 bg-white/[0.035] px-4 outline-none transition focus:border-brand-purple/60"
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
                    </Field>
                    <Field
                      hint="Si actualizas tu correo, te enviaremos una verificacion para proteger la cuenta."
                      label="Correo electronico"
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
                        placeholder="tu@email.com"
                        type="email"
                        value={accountForm.email}
                      />
                    </Field>
                    <Field
                      hint="Campo opcional. Nos ayuda a personalizar recomendaciones y comunicaciones."
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
                    Guardar nueva contrasena
                  </button>

                  <div className="rounded-[14px] border border-white/10 bg-white/[0.025] p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          Autenticacion en dos pasos
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-text-secondary">
                          Refuerza el acceso a tu cuenta con un codigo temporal
                          desde tu app autenticadora.
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
                            Escanea el codigo QR o guarda la clave de respaldo:
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
                    <p className="text-sm text-text-secondary">Tu suscripcion</p>
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
                      Gestion de metodo de pago
                    </button>
                  </div>
                  <div className="rounded-card border border-dashed border-white/15 bg-white/[0.025] p-5 text-sm leading-6 text-text-secondary">
                    Tus facturas y comprobantes apareceran aqui cuando tengas
                    movimientos de suscripcion.
                  </div>
                </section>
              ) : null}

              {activeSection === "notifications" ? (
                <section className="grid gap-3">
                  <Toggle
                    description="Recibe avisos utiles para retomar libros pendientes."
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
                    description="Recibe un informe semanal con progreso, logros y recomendaciones."
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
                    description="Enterate de nuevas colecciones, mejoras y lanzamientos importantes."
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
                          Para proteger tu informacion, la eliminacion de cuenta
                          requiere una verificacion adicional con soporte.
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
                    Nuestro equipo te respondera desde {siteConfig.supportEmail}.
                  </div>
                </section>
              ) : null}
            </div>
          </Card>
        </section>

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
    </main>
  );
}
