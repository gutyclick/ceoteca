"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ExternalLink, Home, LogOut, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

export function DashboardAccountMenu({
  fullName,
  avatarUrl,
}: {
  fullName?: string | null;
  avatarUrl?: string | null;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [account, setAccount] = useState({ fullName: fullName ?? "Ceoteca", avatarUrl: avatarUrl ?? null });

  useEffect(() => {
    if (fullName || avatarUrl) {
      setAccount({ fullName: fullName ?? "Ceoteca", avatarUrl: avatarUrl ?? null });
      return;
    }

    let isMounted = true;
    async function loadAccount() {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name,avatar_url")
          .eq("id", userData.user.id)
          .maybeSingle();

        if (isMounted) {
          setAccount({
            fullName: profile?.full_name ?? userData.user.email?.split("@")[0] ?? "Ceoteca",
            avatarUrl: profile?.avatar_url ?? null,
          });
        }
      } catch {
        // The initials remain available while account data is unavailable.
      }
    }

    void loadAccount();
    return () => { isMounted = false; };
  }, [avatarUrl, fullName]);

  async function signOut() {
    setIsSigningOut(true);
    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
    } finally {
      setIsOpen(false);
      setIsSigningOut(false);
      router.replace("/login");
      router.refresh();
    }
  }

  const initial = account.fullName.trim().at(0)?.toUpperCase() ?? "C";

  return (
    <div className="relative">
      <button
        aria-expanded={isOpen}
        aria-label="Abrir menú de cuenta"
        className="flex h-12 items-center gap-2 rounded-full border border-slate-950/[0.08] bg-white p-1.5 pr-3 text-slate-800 transition hover:border-violet-200 hover:bg-violet-50"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-sm font-black text-white">
          {account.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="h-full w-full object-cover" src={account.avatarUrl} />
          ) : initial}
        </span>
        <ChevronDown aria-hidden="true" className={cn("transition", isOpen && "rotate-180")} size={16} />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-64 rounded-[16px] border border-slate-950/[0.08] bg-white p-2">
          <div className="border-b border-slate-950/[0.06] px-3 py-3">
            <p className="truncate text-sm font-black text-slate-950">{account.fullName}</p>
            <p className="mt-1 text-xs text-slate-500">Cuenta de Ceoteca</p>
          </div>
          <Link
            className="mt-1 flex items-center gap-3 rounded-[12px] px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
            href="/perfil"
            onClick={() => setIsOpen(false)}
          >
            <UserRound aria-hidden="true" size={17} />
            Mi perfil
          </Link>
          <Link
            className="flex items-center gap-3 rounded-[12px] px-3 py-3 text-sm font-bold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
            href="/"
            onClick={() => setIsOpen(false)}
            rel="noreferrer"
            target="_blank"
          >
            <Home aria-hidden="true" size={17} />
            <span className="flex-1">Página de inicio</span>
            <ExternalLink aria-hidden="true" className="text-slate-400" size={14} />
          </Link>
          <button
            className="flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
            disabled={isSigningOut}
            onClick={() => void signOut()}
            type="button"
          >
            <LogOut aria-hidden="true" size={17} />
            {isSigningOut ? "Cerrando sesión..." : "Cerrar sesión"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
