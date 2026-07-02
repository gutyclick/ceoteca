"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { clientEnv } from "@/lib/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type AuthStatus = "checking" | "authenticated";

type PrivateRouteGuardProps = {
  children: React.ReactNode;
};

export function PrivateRouteGuard({ children }: PrivateRouteGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>(
    clientEnv.NEXT_PUBLIC_DEMO_MODE ? "authenticated" : "checking",
  );

  useEffect(() => {
    if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
      return;
    }

    let isMounted = true;
    const supabase = createBrowserSupabaseClient();

    async function verifySession() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        const loginUrl = new URL("/login", window.location.origin);
        loginUrl.searchParams.set("next", pathname);
        router.replace(`${loginUrl.pathname}${loginUrl.search}`);
        return;
      }

      const { data: userData, error } = await supabase.auth.getUser();

      if (error || !userData.user) {
        await supabase.auth.signOut();
        const loginUrl = new URL("/login", window.location.origin);
        loginUrl.searchParams.set("next", pathname);
        router.replace(`${loginUrl.pathname}${loginUrl.search}`);
        return;
      }

      if (isMounted) {
        setStatus("authenticated");
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        const loginUrl = new URL("/login", window.location.origin);
        loginUrl.searchParams.set("next", pathname);
        router.replace(`${loginUrl.pathname}${loginUrl.search}`);
      }
    });

    void verifySession();

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (status === "authenticated") {
    return children;
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-text-primary">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-xl flex-col justify-center">
        <Logo className="[&>span]:text-[15px] [&>span]:tracking-[0.34em]" />
        <Card className="mt-10 rounded-[20px] bg-white/[0.035] p-8 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-purple/20 text-brand-purple">
            <ShieldCheck aria-hidden="true" size={30} />
          </span>
          <h1 className="mt-6 text-3xl font-semibold">Verificando tu sesión</h1>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            Estamos confirmando tu acceso a Ceoteca.
          </p>
          <Loader2
            aria-hidden="true"
            className="mx-auto mt-7 animate-spin text-brand-purple"
            size={28}
          />
        </Card>
      </section>
    </main>
  );
}
