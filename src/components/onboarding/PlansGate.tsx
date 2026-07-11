"use client";

import { useEffect, useState } from "react";

import { DashboardAccountMenu } from "@/components/app/DashboardAccountMenu";
import { DashboardSidebar } from "@/components/app/DashboardSidebar";
import { NotificationBell } from "@/components/app/NotificationBell";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { PlanSelector } from "@/components/subscription/PlanSelector";
import { clientEnv } from "@/lib/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Book } from "@/types";

type GateState = "checking" | "onboarding" | "plans";

export function PlansGate({ books }: { books: Book[] }) {
  const [state, setState] = useState<GateState>("checking");

  useEffect(() => {
    let isMounted = true;

    async function resolveDestination() {
      if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
        if (isMounted) setState("onboarding");
        return;
      }

      const supabase = createBrowserSupabaseClient();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user || !isMounted) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (isMounted) {
        setState(profile?.onboarding_completed ? "plans" : "onboarding");
      }
    }

    void resolveDestination();

    return () => {
      isMounted = false;
    };
  }, []);

  if (state === "checking") {
    return <main aria-busy="true" className="min-h-screen bg-[#fbfaf8]" />;
  }

  if (state === "onboarding") {
    return <OnboardingWizard books={books} />;
  }

  return (
    <main className="min-h-screen bg-[#fbfaf8] pb-12 pl-0 text-slate-950 sm:pl-[var(--dashboard-sidebar-offset,84px)]">
      <DashboardSidebar active="settings" tone="light" />
      <section className="mx-auto w-full max-w-[1380px] px-5 pt-8 sm:px-7 lg:px-10">
        <header className="flex items-start justify-between gap-5 border-b border-slate-950/[0.08] pb-5">
          <div>
            <h1 className="text-4xl font-black tracking-[-0.04em]">Planes</h1>
            <p className="mt-2 text-slate-600">
              Administra tu acceso sin modificar los datos de tu registro.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell tone="light" />
            <DashboardAccountMenu />
          </div>
        </header>
        <PlanSelector />
      </section>
    </main>
  );
}
