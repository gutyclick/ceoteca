import Link from "next/link";
import type { ReactNode } from "react";

import { DashboardAccountMenu } from "@/components/app/DashboardAccountMenu";
import { DashboardSidebar } from "@/components/app/DashboardSidebar";
import { NotificationBell } from "@/components/app/NotificationBell";
import { TrainingSearch } from "@/components/training/TrainingSearch";

const navigation = [
  { label: "Inicio", href: "/ejercicios" },
  { label: "Categorías", href: "/ejercicios/categorias" },
  { label: "Rutas", href: "/ejercicios/rutas" },
  { label: "Simulaciones", href: "/ejercicios/simulaciones" },
  { label: "Repasos", href: "/ejercicios?vista=repasos" },
  { label: "Progreso", href: "/perfil" },
];

export function TrainingPageShell({
  title,
  description,
  children,
  search = true,
}: {
  title: string;
  description: string;
  children: ReactNode;
  search?: boolean;
}) {
  return (
    <main className="min-h-screen w-full min-w-0 overflow-x-clip bg-[#fbfaf8] text-slate-950 [padding-left:var(--dashboard-sidebar-offset,292px)] max-sm:!pl-0">
      <DashboardSidebar active="training" tone="light" />
      <div className="mx-auto w-full max-w-[1560px] px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <header className="min-h-16 min-w-0 border-b border-slate-950/[0.08] pb-5 pl-14 sm:flex sm:flex-wrap sm:items-start sm:justify-between sm:gap-4 sm:pl-0">
          <div>
            <h1 className="text-2xl font-black tracking-[-0.04em] sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
          <div className="mt-4 flex min-w-0 w-full items-center justify-end gap-2 sm:mt-0 sm:w-auto sm:flex-1 sm:gap-3">
            {search ? <TrainingSearch /> : null}
            <NotificationBell tone="light" />
            <DashboardAccountMenu />
          </div>
        </header>
        <nav
          aria-label="Navegación de Training"
          className="mt-4 overflow-x-auto border-b border-slate-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex min-w-max gap-6">
            {navigation.map((item) => (
              <Link
                className="min-h-11 border-b-2 border-transparent px-1 py-3 text-sm font-bold text-slate-600 hover:border-violet-300 hover:text-violet-700"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
