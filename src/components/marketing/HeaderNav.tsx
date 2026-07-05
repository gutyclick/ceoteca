"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function updateHeaderState() {
      setIsScrolled(window.scrollY > 12);
    }

    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });

    return () => window.removeEventListener("scroll", updateHeaderState);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b text-slate-950 transition-all duration-300",
        isScrolled
          ? "border-white/50 bg-white/72 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl"
          : "border-slate-950/[0.06] bg-white",
      )}
    >
      <div className="mx-auto grid min-h-[92px] w-full max-w-[1500px] grid-cols-[220px_minmax(0,1fr)_260px] items-center px-6 sm:px-8 xl:px-10 max-lg:grid-cols-[1fr_auto]">
        <Logo className="text-slate-950" useBrandAsset />

        <nav
          aria-label="Navegación principal"
          className="hidden items-center justify-center gap-9 lg:flex"
        >
          {navigationItems.map((item) => (
            <Link
              className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-bold text-slate-600 transition-colors hover:text-violet-700"
              href={item.href}
              key={item.label}
            >
              {item.label}
              {"hasChevron" in item ? (
                <ChevronDown aria-hidden="true" size={14} />
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center justify-end gap-8 lg:flex">
          <Link
            className="whitespace-nowrap text-sm font-bold text-slate-700 transition-colors hover:text-violet-700"
            href="/login"
          >
            Iniciar sesión
          </Link>
          <Link
            className="inline-flex min-h-14 min-w-[174px] items-center justify-center whitespace-nowrap rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-7 text-sm font-black text-white shadow-[0_22px_55px_rgba(124,58,237,0.24)] transition duration-150 hover:brightness-105"
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
          className="mx-auto w-full max-w-[1500px] border-t border-slate-950/[0.06] px-6 pb-5 pt-3 sm:px-8 lg:hidden"
          id="mobile-navigation"
        >
          <nav aria-label="Navegación móvil" className="grid gap-2">
            {navigationItems.map((item) => (
              <Link
                className="px-1 py-3 text-sm font-bold text-slate-700 transition-colors hover:text-violet-700"
                href={item.href}
                key={item.label}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              className="px-1 py-3 text-sm font-bold text-slate-700"
              href="/login"
              onClick={() => setIsOpen(false)}
            >
              Iniciar sesión
            </Link>
            <Link
              className="mt-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-4 text-center text-sm font-black text-white"
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
