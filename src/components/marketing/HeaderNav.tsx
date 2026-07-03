"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

import { Button, ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

const navigationItems = [
  { href: "/", label: "Inicio" },
  { href: "/biblioteca", label: "Biblioteca" },
  { href: "/pricing", label: "Precios" },
  { href: "/login", label: "Entrar" },
] as const;

export function HeaderNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="ceoteca-container flex min-h-20 items-center justify-between gap-6">
        <Logo />
        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-2 md:flex"
        >
          {navigationItems.map((item) => (
            <ButtonLink key={item.href} href={item.href} variant="ghost" size="sm">
              {item.label}
            </ButtonLink>
          ))}
        </nav>
        <div className="hidden md:block">
          <ButtonLink href="/registro" size="sm">
            Empieza gratis
          </ButtonLink>
        </div>
        <Button
          aria-controls="mobile-navigation"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
          className="h-11 w-11 px-0 md:hidden"
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
          className="ceoteca-container border-t border-white/10 pb-5 pt-3 md:hidden"
          id="mobile-navigation"
        >
          <nav aria-label="Navegación móvil" className="grid gap-2">
            {navigationItems.map((item) => (
              <ButtonLink
                className="justify-start"
                href={item.href}
                key={item.href}
                onClick={() => setIsOpen(false)}
                variant="ghost"
              >
                {item.label}
              </ButtonLink>
            ))}
            <ButtonLink
              className="mt-2"
              href="/registro"
              onClick={() => setIsOpen(false)}
            >
              Empieza gratis
            </ButtonLink>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
