"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Gem,
  Home,
  LogOut,
  Settings,
  User,
  X,
} from "lucide-react";

import { Logo } from "@/components/ui/Logo";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

type DashboardSection = "home" | "library" | "profile" | "settings";

type DashboardSidebarProps = {
  active: DashboardSection;
  tone?: "dark" | "light";
};

const menuItems = [
  { key: "home", label: "Inicio", href: "/home", icon: Home },
  { key: "library", label: "Biblioteca", href: "/biblioteca", icon: BookOpen },
  { key: "profile", label: "Perfil", href: "/perfil", icon: User },
  { key: "settings", label: "Ajustes", href: "/configuracion", icon: Settings },
] as const;

function getInitials(name: string, email: string) {
  const source = name.trim().length > 0 ? name : email;
  const parts = source.split(/[ @._-]+/).filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part.at(0)?.toUpperCase() ?? "")
    .join("");
}

export function DashboardSidebar({
  active,
  tone = "dark",
}: DashboardSidebarProps) {
  const router = useRouter();
  const isLight = tone === "light";
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [profile, setProfile] = useState({
    fullName: "Usuario",
    email: "",
    avatarUrl: null as string | null,
  });

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1280px)");
    const mobileQuery = window.matchMedia("(max-width: 639px)");

    function syncDesktop(event: MediaQueryList | MediaQueryListEvent) {
      const matches = event.matches;
      setIsDesktop(matches);
      setIsExpanded(matches && isLight);
    }

    function syncMobile(event: MediaQueryList | MediaQueryListEvent) {
      setIsMobile(event.matches);
      if (event.matches) {
        setIsExpanded(false);
      }
    }

    syncDesktop(desktopQuery);
    syncMobile(mobileQuery);
    desktopQuery.addEventListener("change", syncDesktop);
    mobileQuery.addEventListener("change", syncMobile);

    return () => {
      desktopQuery.removeEventListener("change", syncDesktop);
      mobileQuery.removeEventListener("change", syncMobile);
    };
  }, [isLight]);

  useEffect(() => {
    const offset = isDesktop
      ? isLight
        ? "292px"
        : isExpanded
        ? "292px"
        : "100px"
      : isMobile
        ? "0px"
        : "84px";
    document.documentElement.style.setProperty("--dashboard-sidebar-offset", offset);

    return () => {
      document.documentElement.style.removeProperty("--dashboard-sidebar-offset");
    };
  }, [isDesktop, isExpanded, isLight, isMobile]);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          return;
        }

        const { data } = await supabase
          .from("profiles")
          .select("full_name,avatar_url")
          .eq("id", userData.user.id)
          .maybeSingle();

        if (isMounted) {
          setProfile({
            fullName: data?.full_name ?? "Usuario",
            email: userData.user.email ?? "",
            avatarUrl: data?.avatar_url ?? null,
          });
        }
      } catch {
        if (isMounted) {
          setProfile({
            fullName: "Usuario",
            email: "",
            avatarUrl: null,
          });
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  async function signOut() {
    setIsSigningOut(true);

    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
    } finally {
      setIsSigningOut(false);
      router.push("/login");
      router.refresh();
    }
  }

  const initials = getInitials(profile.fullName, profile.email);
  const isLightDesktop = isLight && isDesktop;
  const showLabels = isExpanded || isLightDesktop;

  if (isMobile && !isExpanded) {
    return (
      <button
        aria-label="Abrir menú"
        className={cn(
          "fixed left-3 top-3 z-50 grid h-12 w-12 place-items-center rounded-[16px] border shadow-ambient backdrop-blur-xl transition hover:border-brand-purple/45",
          isLight
            ? "border-slate-950/[0.08] bg-white/95 text-slate-950"
            : "border-white/10 bg-[#080a10]/95 text-text-primary",
        )}
        onClick={() => setIsExpanded(true)}
        type="button"
      >
        <Logo
          className="justify-center [&>span]:hidden"
          useBrandAsset={isLight}
          variant="icon"
        />
      </button>
    );
  }

  return (
    <>
      {!isDesktop && isExpanded ? (
        <button
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]"
          onClick={() => setIsExpanded(false)}
          type="button"
        />
      ) : null}

      <aside
        className={cn(
          "fixed z-50 flex flex-col border backdrop-blur-xl transition-[width,transform,box-shadow] duration-300 ease-out",
          isLightDesktop
            ? "left-0 top-0 h-screen w-[280px] rounded-none border-y-0 border-l-0 border-r border-slate-950/[0.08] bg-white px-7 py-8 text-slate-950 shadow-none"
            : "left-3 top-3 h-[calc(100svh-1.5rem)] rounded-[22px] p-2.5 shadow-ambient sm:left-4 sm:top-4 sm:h-[calc(100svh-2rem)] sm:p-3",
          !isLightDesktop &&
            (isLight
              ? "border-slate-950/[0.08] bg-white/92 text-slate-950 shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
              : "border-white/10 bg-[#080a10]/95 text-text-primary"),
          !isLightDesktop &&
            (isExpanded
              ? "w-[min(280px,calc(100vw-1.5rem))] shadow-[0_24px_90px_rgba(15,23,42,0.16)] sm:w-[260px]"
              : "w-[60px] sm:w-[68px]"),
        )}
      >
        <div className="flex items-center justify-between gap-2">
          {showLabels ? (
            <Logo
              className={cn(
                "[&>span]:text-[18px] [&>span]:font-black [&>span]:tracking-[-0.03em]",
                isLightDesktop && "text-slate-950 [&>span]:text-slate-950",
                !isLightDesktop &&
                  "[&>span]:text-[13px] [&>span]:tracking-[0.24em]",
              )}
              useBrandAsset={isLight && !isLightDesktop}
            />
          ) : (
            <Logo
              className="justify-center [&>span]:hidden"
              useBrandAsset={isLight}
              variant="icon"
            />
          )}
          {!isLightDesktop ? (
            <button
              aria-label={isExpanded ? "Contraer menú" : "Expandir menú"}
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-full border transition",
                isLight
                  ? "border-slate-950/[0.08] bg-slate-50 text-slate-500 hover:text-violet-700"
                  : "border-white/10 bg-white/[0.04] text-text-secondary hover:text-white",
              )}
              onClick={() => setIsExpanded((current) => !current)}
              type="button"
            >
              {!isDesktop && isExpanded ? (
                <X aria-hidden="true" size={17} />
              ) : isExpanded ? (
                <ChevronLeft aria-hidden="true" size={17} />
              ) : (
                <ChevronRight aria-hidden="true" size={17} />
              )}
            </button>
          ) : null}
        </div>

        <nav
          aria-label="Menú principal"
          className={cn("grid gap-2", isLightDesktop ? "mt-11" : "mt-8")}
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;

            return (
              <Link
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-[14px] px-3 text-sm transition",
                  isLight
                    ? "text-slate-600 hover:bg-violet-50 hover:text-violet-700"
                    : "text-text-secondary hover:bg-white/[0.055] hover:text-white",
                  isActive &&
                    (isLight
                      ? "bg-violet-50 text-violet-700"
                      : "bg-white/[0.08] text-white"),
                  isLightDesktop && "min-h-12 rounded-[16px] px-4 font-semibold",
                  !showLabels && "justify-center px-0",
                )}
                href={item.href}
                key={item.key}
                title={!showLabels ? item.label : undefined}
              >
                <Icon
                  aria-hidden="true"
                  className={cn(isActive && "text-brand-purple")}
                  size={22}
                />
                {showLabels ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        {isLightDesktop ? (
          <div className="mt-auto rounded-[22px] border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4 shadow-[0_18px_55px_rgba(124,58,237,0.10)]">
            <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-violet-100 text-violet-700">
              <Gem aria-hidden="true" size={22} />
            </span>
            <h3 className="mt-4 text-base font-black tracking-[-0.02em]">
              Mejora a Pro
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Accede a más análisis, audio y apoyo de CEO para aplicar ideas.
            </p>
            <Link
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-violet-700 to-fuchsia-500 text-sm font-black text-white shadow-[0_16px_35px_rgba(124,58,237,0.22)]"
              href="/precios"
            >
              Mejorar a Pro
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        ) : null}

        {!isLightDesktop ? (
        <div className="relative mt-auto">
          {isProfileOpen ? (
            <div
              className={cn(
                "absolute bottom-[76px] rounded-[16px] border p-2 shadow-ambient",
                isLight
                  ? "border-slate-950/[0.08] bg-white text-slate-950 shadow-[0_18px_50px_rgba(15,23,42,0.10)]"
                  : "border-white/10 bg-[#0d0f17]",
                isExpanded ? "left-0 w-full" : "left-0 w-52",
              )}
            >
              <button
                className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-left text-sm text-danger transition hover:bg-danger/10"
                disabled={isSigningOut}
                onClick={() => void signOut()}
                type="button"
              >
                <LogOut aria-hidden="true" size={17} />
                {isSigningOut ? "Cerrando..." : "Cerrar sesión"}
              </button>
            </div>
          ) : null}

          <button
            className={cn(
              "flex w-full items-center gap-3 rounded-[16px] border p-2 text-left transition hover:border-brand-purple/40",
              isLight
                ? "border-slate-950/[0.08] bg-slate-50"
                : "border-white/10 bg-white/[0.035]",
              !showLabels && "justify-center",
            )}
            onClick={() => setIsProfileOpen((current) => !current)}
            type="button"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[12px] bg-brand-purple/20 text-sm font-semibold text-white">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="h-full w-full object-cover"
                  src={profile.avatarUrl}
                />
              ) : (
                initials
              )}
            </span>
            {showLabels ? (
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {profile.fullName}
                </span>
                <span
                  className={cn(
                    "block truncate text-xs",
                    isLight ? "text-slate-500" : "text-text-muted",
                  )}
                >
                  {profile.email || "Cuenta Ceoteca"}
                </span>
              </span>
            ) : null}
          </button>
        </div>
        ) : null}
      </aside>
    </>
  );
}
