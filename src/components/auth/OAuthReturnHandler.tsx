"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { clientEnv } from "@/lib/env";
import { oauthNextStorageKey } from "@/lib/auth/supabase";
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
      const pendingNext = window.localStorage.getItem(oauthNextStorageKey);
      const hasOAuthCode = Boolean(searchParams.get("code"));

      if (!pendingNext && !hasOAuthCode) {
        return;
      }

      try {
        const supabase = createBrowserSupabaseClient();
        const code = searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }
        }

        const { data } = await supabase.auth.getSession();

        if (!data.session || !isMounted) {
          return;
        }

        const nextPath = getSafeNext(pendingNext);
        window.localStorage.removeItem(oauthNextStorageKey);
        router.replace(nextPath);
        router.refresh();
      } catch {
        window.localStorage.removeItem(oauthNextStorageKey);
      }
    }

    void handleFallbackReturn();

    return () => {
      isMounted = false;
    };
  }, [pathname, router, searchParams]);

  return null;
}
