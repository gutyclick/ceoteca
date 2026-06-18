import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

const navigationItems = [
  { href: "/biblioteca", label: "Biblioteca" },
  { href: "/pricing", label: "Precios" },
  { href: "/login", label: "Entrar" },
] as const;

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="ceoteca-container flex min-h-20 items-center justify-between gap-6">
        <Logo />
        <nav
          aria-label="Navegacion principal"
          className="hidden items-center gap-2 md:flex"
        >
          {navigationItems.map((item) => (
            <ButtonLink key={item.href} href={item.href} variant="ghost" size="sm">
              {item.label}
            </ButtonLink>
          ))}
        </nav>
        <ButtonLink href="/registro" size="sm">
          Empieza gratis
        </ButtonLink>
      </div>
    </header>
  );
}
