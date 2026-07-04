"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { clientEnv } from "@/lib/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function getSafeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/home";
  }

  return value;
}

export function OAuthReturnHandler() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (clientEnv.NEXT_PUBLIC_DEMO_MODE || pathname === "/auth/callback") {
      return;
    }

    let isMounted = true;

    async function handleFallbackReturn() {
      const code = searchParams.get("code");

      if (!code) {
        return;
      }

      try {
        const supabase = createBrowserSupabaseClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          throw error;
        }

        const { data } = await supabase.auth.getSession();

        if (!data.session || !isMounted) {
          return;
        }

        router.replace(getSafeNext(searchParams.get("next")));
        router.refresh();
      } catch {
        router.replace("/login");
      }
    }

    void handleFallbackReturn();

    return () => {
      isMounted = false;
    };
  }, [pathname, router, searchParams]);

  return null;
}
