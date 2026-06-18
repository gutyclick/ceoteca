"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  Bot,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  Globe2,
  HelpCircle,
  Home,
  LogOut,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { siteConfig } from "@/config/site";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

type SettingsItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  tone?: "purple" | "cyan" | "blue" | "danger";
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
    title: "Perfil",
    description: "Edita tu informacion personal",
    icon: User,
    href: "/perfil",
  },
  {
    title: "Seguridad",
    description: "Contrasena, inicio de sesion y privacidad",
    icon: ShieldCheck,
  },
  {
    title: "Suscripcion y pagos",
    description: "Gestiona tu plan y metodos de pago",
    icon: CreditCard,
    href: "/planes",
  },
  {
    title: "Notificaciones",
    description: "Elige que y cuando quieres recibir",
    icon: Bell,
  },
  {
    title: "Preferencias de aprendizaje",
    description: "Personaliza tu experiencia en Ceoteca",
    icon: SlidersHorizontal,
  },
  {
    title: "Idioma y region",
    description: "Idioma, zona horaria y region",
    icon: Globe2,
  },
  {
    title: "Datos y privacidad",
    description: "Exporta o elimina tu informacion",
    icon: Download,
    tone: "cyan",
  },
  {
    title: "Ayuda y soporte",
    description: "Centro de ayuda y contacto",
    icon: HelpCircle,
    href: `mailto:${siteConfig.supportEmail}`,
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

function SettingsRow({ item }: { item: SettingsItem }) {
  const Icon = item.icon;
  const iconClass = {
    purple: "bg-brand-purple/15 text-brand-purple border-brand-purple/20",
    cyan: "bg-cyan-400/12 text-cyan-300 border-cyan-300/20",
    blue: "bg-blue-400/12 text-blue-300 border-blue-300/20",
    danger: "bg-danger/12 text-danger border-danger/25",
  }[item.tone ?? "purple"];
  const content = (
    <>
      <span
        className={cn(
          "grid h-20 w-20 shrink-0 place-items-center rounded-[18px] border",
          iconClass,
        )}
      >
        <Icon aria-hidden="true" size={34} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-2xl font-semibold">{item.title}</span>
        <span className="mt-2 block text-lg text-text-secondary">
          {item.description}
        </span>
      </span>
      <ChevronRight aria-hidden="true" className="text-text-secondary" size={30} />
    </>
  );

  if (item.href) {
    return (
      <Link
        className="flex items-center gap-7 border-b border-white/10 py-5 transition last:border-b-0 hover:text-brand-purple"
        href={item.href}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      className="flex w-full items-center gap-7 border-b border-white/10 py-5 text-left transition last:border-b-0 hover:text-brand-purple"
      type="button"
    >
      {content}
    </button>
  );
}

export function SettingsView() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  useEffect(() => {
    setSignOutError(null);
  }, []);

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

  return (
    <main className="min-h-screen overflow-hidden bg-[#03040b] pb-36 text-text-primary">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(124,58,237,0.18),transparent_28%),radial-gradient(circle_at_76%_18%,rgba(79,99,255,0.12),transparent_30%),linear-gradient(180deg,#02030a_0%,#050612_52%,#04040a_100%)]" />

      <section className="mx-auto w-full max-w-[1120px] px-5 pt-7 md:px-8">
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

        <section className="mt-14 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
          <div className="flex items-start gap-6">
            <button
              aria-label="Volver"
              className="mt-4 text-brand-purple transition hover:text-white"
              onClick={() => router.back()}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={42} />
            </button>
            <div>
              <h1 className="text-6xl font-semibold">Ajustes</h1>
              <p className="mt-6 text-2xl text-text-secondary">
                Administra tu cuenta y preferencias
              </p>
            </div>
          </div>

          <div className="relative hidden min-h-48 lg:block">
            <div className="absolute right-8 top-8 h-28 w-28 rotate-12 rounded-[28px] bg-brand-gradient shadow-[0_0_55px_rgba(124,58,237,0.55)]" />
            <div className="absolute right-0 top-16 h-24 w-56 rounded-[26px] border border-white/10 bg-white/[0.055]" />
            <div className="absolute right-16 top-20 h-7 w-24 rounded-full bg-black/50">
              <span className="ml-auto block h-7 w-7 rounded-full bg-brand-purple" />
            </div>
            <Settings
              aria-hidden="true"
              className="absolute right-24 top-14 text-white drop-shadow-[0_0_20px_rgba(124,58,237,0.65)]"
              size={92}
            />
          </div>
        </section>

        <Card className="mt-14 rounded-[24px] bg-white/[0.035] p-8">
          {settingsItems.map((item) => (
            <SettingsRow item={item} key={item.title} />
          ))}
        </Card>

        <Card className="mt-5 rounded-[24px] bg-white/[0.035] p-8">
          <p className="text-lg text-text-secondary">Cuenta</p>
          <button
            className="mt-5 flex w-full items-center gap-7 rounded-card text-left text-danger transition hover:bg-danger/5"
            disabled={isSigningOut}
            onClick={() => void signOut()}
            type="button"
          >
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-[18px] border border-danger/25 bg-danger/12 text-danger">
              <LogOut aria-hidden="true" size={34} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-2xl font-semibold">
                {isSigningOut ? "Cerrando sesion..." : "Cerrar sesion"}
              </span>
              <span className="mt-2 block text-lg text-text-secondary">
                Sal de tu cuenta de Ceoteca
              </span>
            </span>
            <ChevronRight aria-hidden="true" size={30} />
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
