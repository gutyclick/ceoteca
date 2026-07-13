"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Loader2, ShieldX } from "lucide-react";

import { editorialRequest } from "@/lib/training/editorial-api";
import { AdminTrainingShell } from "@/components/training/admin/AdminTrainingShell";

export function AdminAccessGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"checking" | "allowed" | "denied">(
    "checking",
  );

  useEffect(() => {
    let active = true;
    editorialRequest<{ authorized: true; role: string }>(
      "/api/admin/training/access",
    )
      .then(() => {
        if (active) setState("allowed");
      })
      .catch(() => {
        if (active) setState("denied");
      });
    return () => {
      active = false;
    };
  }, []);

  if (state === "checking") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fbfaf8]">
        <div className="text-center" aria-live="polite">
          <Loader2
            aria-label="Verificando acceso editorial"
            className="mx-auto animate-spin text-violet-700 motion-reduce:animate-none"
            size={30}
          />
          <p className="mt-3 text-sm font-semibold text-slate-600">
            Verificando acceso editorial…
          </p>
        </div>
      </main>
    );
  }

  if (state === "denied") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fbfaf8] p-5">
        <section className="w-full max-w-md rounded-[8px] border border-slate-200 bg-white p-8 text-center">
          <ShieldX className="mx-auto text-rose-600" size={36} />
          <h1 className="mt-4 text-2xl font-black">Acceso restringido</h1>
          <p className="mt-2 leading-6 text-slate-600">
            Esta sección está disponible únicamente para el equipo editorial
            autorizado de CEOTECA.
          </p>
          <Link
            className="mt-6 inline-flex min-h-11 items-center rounded-[8px] bg-violet-700 px-5 font-bold text-white"
            href="/home"
          >
            Volver al inicio
          </Link>
        </section>
      </main>
    );
  }

  return <AdminTrainingShell>{children}</AdminTrainingShell>;
}
