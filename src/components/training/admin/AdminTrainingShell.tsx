"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenCheck,
  ChartNoAxesCombined,
  ClipboardCheck,
  FileClock,
  LayoutDashboard,
  ListChecks,
  Network,
  MessagesSquare,
  Scale,
  Route,
  Menu,
  X,
  WandSparkles,
} from "lucide-react";
import { useState, type ReactNode } from "react";
const links = [
  { href: "/admin/training", label: "Resumen", icon: LayoutDashboard },
  {
    href: "/admin/training/analytics",
    label: "Analítica pedagógica",
    icon: ChartNoAxesCombined,
  },
  { href: "/admin/training/exercises", label: "Ejercicios", icon: ListChecks },
  {
    href: "/admin/training/taxonomy",
    label: "Taxonomía",
    icon: Network,
  },
  { href: "/admin/training/paths", label: "Rutas", icon: Route },
  {
    href: "/admin/training/roleplay",
    label: "Simulaciones",
    icon: MessagesSquare,
  },
  {
    href: "/admin/training/ai-generator",
    label: "Asistencia con IA",
    icon: WandSparkles,
  },
  {
    href: "/admin/training/templates",
    label: "Plantillas",
    icon: BookOpenCheck,
  },
  { href: "/admin/training/rubrics", label: "Rúbricas", icon: Scale },
  {
    href: "/admin/training/reviews",
    label: "Revisiones",
    icon: ClipboardCheck,
  },
  { href: "/admin/training/audit", label: "Auditoría", icon: FileClock },
];
export function AdminTrainingShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#fbfaf8] text-slate-950">
      <button
        aria-label="Abrir navegación editorial"
        className="fixed left-4 top-4 z-30 grid h-11 w-11 place-items-center rounded-[8px] border border-slate-200 bg-white lg:hidden"
        onClick={() => setMobileOpen(true)}
        type="button"
      >
        <Menu size={20} />
      </button>
      {mobileOpen ? (
        <button
          aria-label="Cerrar navegación editorial"
          className="fixed inset-0 z-30 bg-slate-950/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
          type="button"
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white p-5 transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <button
          aria-label="Cerrar navegación"
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center lg:hidden"
          onClick={() => setMobileOpen(false)}
          type="button"
        >
          <X size={20} />
        </button>
        <Link
          className="text-xl font-black text-violet-700"
          href="/admin/training"
        >
          CEOTECA Editorial
        </Link>
        <nav className="mt-8 space-y-1" aria-label="Administración de Training">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              className={`flex min-h-11 items-center gap-3 rounded-[8px] px-3 text-sm font-bold ${pathname === href || (href !== "/admin/training" && pathname.startsWith(`${href}/`)) ? "bg-violet-50 text-violet-700" : "text-slate-600 hover:bg-slate-50"}`}
              href={href}
              key={href}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <Link
          className="absolute bottom-5 left-5 text-sm font-bold text-slate-500"
          href="/ejercicios"
        >
          Volver a Training
        </Link>
      </aside>
      <main className="min-w-0 px-4 pb-6 pt-20 sm:px-6 lg:ml-64 lg:px-8 lg:pt-6">
        <div className="mx-auto max-w-[1440px]">{children}</div>
      </main>
    </div>
  );
}
