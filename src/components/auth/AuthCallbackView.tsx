"use client";

import { Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type CallbackState =
  | { type: "loading"; message: string }
  | { type: "error"; message: string };

function getSafeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/home";
  }

  return value;
}

export function AuthCallbackView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(
    () => getSafeNext(searchParams.get("next")),
    [searchParams],
  );
  const [state, setState] = useState<CallbackState>({
    type: "loading",
    message: "Estamos validando tu acceso con Google.",
  });

  useEffect(() => {
    let isMounted = true;

    async function finishGoogleSignIn() {
      try {
        const supabase = createBrowserSupabaseClient();
        const code = searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }
        }

        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          throw new Error("No pudimos confirmar tu sesión con Google.");
        }

        router.replace(nextPath);
        router.refresh();
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setState({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "No pudimos completar el inicio de sesión con Google.",
        });
      }
    }

    void finishGoogleSignIn();

    return () => {
      isMounted = false;
    };
  }, [nextPath, router, searchParams]);

  const isError = state.type === "error";

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-text-primary">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-xl flex-col justify-center">
        <Logo className="[&>span]:text-[15px] [&>span]:tracking-[0.34em]" />
        <Card className="mt-10 rounded-[20px] bg-white/[0.035] p-8 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-purple/20 text-brand-purple">
            {isError ? (
              <TriangleAlert aria-hidden="true" size={30} />
            ) : (
              <ShieldCheck aria-hidden="true" size={30} />
            )}
          </span>
          <h1 className="mt-6 text-3xl font-semibold">
            {isError ? "No pudimos iniciar sesión" : "Conectando tu cuenta"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            {state.message}
          </p>
          {!isError ? (
            <Loader2
              aria-hidden="true"
              className="mx-auto mt-7 animate-spin text-brand-purple"
              size={28}
            />
          ) : (
            <button
              className="mt-7 inline-flex min-h-12 items-center justify-center rounded-button bg-brand-gradient px-5 text-sm font-medium text-white transition hover:brightness-110"
              onClick={() => router.replace("/login")}
              type="button"
            >
              Volver al login
            </button>
          )}
        </Card>
      </section>
    </main>
  );
}
