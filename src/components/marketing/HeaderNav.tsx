"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";

import { Button, ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

const navigationItems = [
  { href: "/", label: "Inicio" },
  { href: "/biblioteca", label: "Biblioteca" },
  { href: "/biblioteca?categoria=all", label: "Categorías" },
  { href: "/pricing", label: "Recursos", hasChevron: true },
] as const;

export function HeaderNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-950/[0.06] bg-[#fbfaf8]/85 backdrop-blur-xl">
      <div className="ceoteca-container flex min-h-20 items-center justify-between gap-6">
        <Logo className="text-slate-950" />
        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-1 rounded-full border border-slate-950/[0.06] bg-white/75 p-1 shadow-[0_12px_40px_rgba(15,23,42,0.06)] lg:flex"
        >
          {navigationItems.map((item) => (
            <ButtonLink
              className="text-slate-600 hover:bg-violet-50 hover:text-violet-700"
              href={item.href}
              key={item.label}
              size="sm"
              variant={item.href === "/" ? "secondary" : "ghost"}
            >
              {item.label}
              {"hasChevron" in item ? (
                <ChevronDown aria-hidden="true" size={14} />
              ) : null}
            </ButtonLink>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <ButtonLink
            className="text-slate-700 hover:text-violet-700"
            href="/login"
            size="sm"
            variant="ghost"
          >
            Iniciar sesión
          </ButtonLink>
          <ButtonLink href="/registro" size="sm">
            Empieza gratis
          </ButtonLink>
        </div>
        <Button
          aria-controls="mobile-navigation"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
          className="h-11 w-11 border-slate-950/10 bg-white px-0 text-slate-950 shadow-sm lg:hidden"
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
              <ButtonLink
                className="justify-start text-slate-700"
                href={item.href}
                key={item.label}
                onClick={() => setIsOpen(false)}
                variant="ghost"
              >
                {item.label}
              </ButtonLink>
            ))}
            <ButtonLink
              className="justify-start text-slate-700"
              href="/login"
              onClick={() => setIsOpen(false)}
              variant="secondary"
            >
              Iniciar sesión
            </ButtonLink>
            <ButtonLink href="/registro" onClick={() => setIsOpen(false)}>
              Empieza gratis
            </ButtonLink>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
