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
  { href: "/pricing", label: "Sobre nosotros" },
] as const;

export function HeaderNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-950/[0.05] bg-[#fbfaf8]/90 backdrop-blur-xl">
      <div className="ceoteca-container grid min-h-20 grid-cols-[auto_auto] items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
        <Logo className="text-slate-950" />

        <nav
          aria-label="Navegación principal"
          className="hidden items-center justify-center gap-1 lg:flex"
        >
          {navigationItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href.split("?")[0]);

            return (
              <Link
                className={cn(
                  "inline-flex min-h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-violet-700 hover:shadow-sm",
                  isActive &&
                    "bg-violet-50 text-violet-700 shadow-[0_10px_28px_rgba(124,58,237,0.08)]",
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

        <div className="hidden items-center justify-end gap-3 lg:flex">
          <Link
            className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-violet-700"
            href="/login"
          >
            Iniciar sesión
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 text-sm font-bold text-white shadow-[0_16px_40px_rgba(124,58,237,0.22)] transition hover:brightness-110"
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
          className="ceoteca-container border-t border-slate-950/[0.06] pb-5 pt-3 lg:hidden"
          id="mobile-navigation"
        >
          <nav aria-label="Navegación móvil" className="grid gap-2">
            {navigationItems.map((item) => (
              <Link
                className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-violet-700"
                href={item.href}
                key={item.label}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              className="rounded-xl border border-slate-950/10 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
              href="/login"
              onClick={() => setIsOpen(false)}
            >
              Iniciar sesión
            </Link>
            <Link
              className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3 text-center text-sm font-bold text-white"
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
