"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils/cn";

const navigationItems = [
  { href: "/", label: "Inicio" },
  { href: "/biblioteca", label: "Biblioteca" },
  { href: "/biblioteca?categoria=all", label: "Categorías" },
  { href: "/pricing", label: "Recursos", hasChevron: true },
  { href: "/#por-que-ceoteca", label: "Sobre nosotros" },
] as const;

export function HeaderNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-950/[0.045] bg-[#fffdfa]/92 backdrop-blur-xl">
      <div className="mx-auto grid min-h-[86px] w-full max-w-[1480px] grid-cols-[auto_auto] items-center gap-6 px-6 sm:px-8 lg:grid-cols-[260px_minmax(0,1fr)_300px] xl:px-10">
        <Logo className="text-slate-950" useBrandAsset />

        <nav
          aria-label="Navegación principal"
          className="hidden items-center justify-center gap-3 lg:flex"
        >
          {navigationItems.map((item) => {
            const hrefBase = item.href.split(/[?#]/)[0];
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : hrefBase !== "/" && pathname === hrefBase;

            return (
              <Link
                className={cn(
                  "inline-flex min-h-11 items-center gap-1.5 rounded-2xl px-4 text-sm font-bold text-slate-600 transition-colors duration-150 hover:text-slate-950",
                  isActive && "bg-[#f2edff] text-violet-700 shadow-[0_18px_48px_rgba(124,58,237,0.12)]",
                )}
                href={item.href}
                key={item.label}
              >
                {item.label}
                {"hasChevron" in item ? (
                  <ChevronDown aria-hidden="true" size={14} />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center justify-end gap-4 lg:flex">
          <Link
            className="rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:text-slate-950"
            href="/login"
          >
            Iniciar sesión
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-7 text-sm font-black text-white shadow-[0_22px_55px_rgba(124,58,237,0.26)] transition duration-150 hover:scale-[1.01]"
            href="/registro"
          >
            Empieza gratis
          </Link>
        </div>

        <Button
          aria-controls="mobile-navigation"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
          className="ml-auto h-11 w-11 border-slate-950/10 bg-white px-0 text-slate-950 shadow-sm lg:hidden"
          onClick={() => setIsOpen((current) => !current)}
          size="sm"
          variant="secondary"
        >
          {isOpen ? (
            <X aria-hidden="true" size={20} />
          ) : (
            <Menu aria-hidden="true" size={20} />
          )}
        </Button>
      </div>

      {isOpen ? (
        <div
          className="mx-auto w-full max-w-[1480px] border-t border-slate-950/[0.06] px-6 pb-5 pt-3 sm:px-8 lg:hidden"
          id="mobile-navigation"
        >
          <nav aria-label="Navegación móvil" className="grid gap-2">
            {navigationItems.map((item) => (
              <Link
                className="rounded-xl px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:text-slate-950"
                href={item.href}
                key={item.label}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              className="rounded-xl border border-slate-950/10 bg-white px-4 py-3 text-sm font-bold text-slate-700"
              href="/login"
              onClick={() => setIsOpen(false)}
            >
              Iniciar sesión
            </Link>
            <Link
              className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3 text-center text-sm font-black text-white"
              href="/registro"
              onClick={() => setIsOpen(false)}
            >
              Empieza gratis
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
