"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
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
};

const menuItems = [
  { key: "home", label: "Inicio", href: "/home", icon: Home },
  { key: "library", label: "Biblioteca", href: "/biblioteca", icon: BookOpen },
  { key: "profile", label: "Perfil", href: "/perfil", icon: User },
  {
    key: "settings",
    label: "Configuracion",
    href: "/configuracion",
    icon: Settings,
  },
] as const;

function getInitials(name: string, email: string) {
  const source = name.trim().length > 0 ? name : email;
  const parts = source.split(/[ @._-]+/).filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part.at(0)?.toUpperCase() ?? "")
    .join("");
}

export function DashboardSidebar({ active }: DashboardSidebarProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [profile, setProfile] = useState({
    fullName: "Usuario",
    email: "",
    avatarUrl: null as string | null,
  });

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1280px)");

    function syncLayout(event: MediaQueryList | MediaQueryListEvent) {
      setIsDesktop(event.matches);
      setIsExpanded(false);
    }

    syncLayout(query);
    query.addEventListener("change", syncLayout);

    return () => query.removeEventListener("change", syncLayout);
  }, []);

  useEffect(() => {
    const offset = isDesktop ? (isExpanded ? "292px" : "100px") : "84px";
    document.documentElement.style.setProperty("--dashboard-sidebar-offset", offset);

    return () => {
      document.documentElement.style.removeProperty("--dashboard-sidebar-offset");
    };
  }, [isDesktop, isExpanded]);

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

  return (
    <>
      {!isDesktop && isExpanded ? (
        <button
          aria-label="Cerrar menu"
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]"
          onClick={() => setIsExpanded(false)}
          type="button"
        />
      ) : null}

      <aside
        className={cn(
          "fixed left-3 top-3 z-50 flex h-[calc(100svh-1.5rem)] flex-col rounded-[22px] border border-white/10 bg-[#080a10]/95 p-2.5 text-text-primary shadow-ambient backdrop-blur-xl transition-[width,transform,box-shadow] duration-300 ease-out sm:left-4 sm:top-4 sm:h-[calc(100svh-2rem)] sm:p-3",
          isExpanded
            ? "w-[min(280px,calc(100vw-1.5rem))] shadow-[0_24px_90px_rgba(0,0,0,0.45)] sm:w-[260px]"
            : "w-[60px] sm:w-[68px]",
        )}
      >
      <div className="flex items-center justify-between gap-2">
        {isExpanded ? (
          <Logo className="[&>span]:text-[13px] [&>span]:tracking-[0.24em]" />
        ) : (
          <Logo className="justify-center [&>span]:hidden" variant="icon" />
        )}
        <button
          aria-label={isExpanded ? "Contraer menu" : "Expandir menu"}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-text-secondary transition hover:text-white"
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
      </div>

      <nav className="mt-8 grid gap-2" aria-label="Menu principal">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;

          return (
            <Link
              className={cn(
                "flex min-h-12 items-center gap-3 rounded-[14px] px-3 text-sm text-text-secondary transition hover:bg-white/[0.055] hover:text-white",
                isActive && "bg-white/[0.08] text-white",
                !isExpanded && "justify-center px-0",
              )}
              href={item.href}
              key={item.key}
              title={!isExpanded ? item.label : undefined}
            >
              <Icon
                aria-hidden="true"
                className={cn(isActive && "text-brand-purple")}
                size={22}
              />
              {isExpanded ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="relative mt-auto">
        {isProfileOpen ? (
          <div
            className={cn(
              "absolute bottom-[76px] rounded-[16px] border border-white/10 bg-[#0d0f17] p-2 shadow-ambient",
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
            "flex w-full items-center gap-3 rounded-[16px] border border-white/10 bg-white/[0.035] p-2 text-left transition hover:border-brand-purple/40",
            !isExpanded && "justify-center",
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
          {isExpanded ? (
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {profile.fullName}
              </span>
              <span className="block truncate text-xs text-text-muted">
                {profile.email || "Cuenta Ceoteca"}
              </span>
            </span>
          ) : null}
        </button>
      </div>
      </aside>
    </>
  );
}
