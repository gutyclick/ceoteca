"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { clientEnv } from "@/lib/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type PrivateRouteGuardProps = {
  children: React.ReactNode;
};

export function PrivateRouteGuard({ children }: PrivateRouteGuardProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
      return;
    }

    let isMounted = true;
    const supabase = createBrowserSupabaseClient();

    async function redirectToLogin() {
      const loginUrl = new URL("/login", window.location.origin);
      loginUrl.searchParams.set("next", pathname);
      router.replace(`${loginUrl.pathname}${loginUrl.search}`);
    }

    async function verifySession() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (!sessionData.session) {
        await redirectToLogin();
        return;
      }

      const { data: userData, error } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (error || !userData.user) {
        await supabase.auth.signOut();
        await redirectToLogin();
        return;
      }

      if (pathname !== "/planes") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", userData.user.id)
          .maybeSingle();

        if (isMounted && profile && !profile.onboarding_completed) {
          router.replace("/planes");
        }
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        void redirectToLogin();
      }
    });

    void verifySession();

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  return children;
}
