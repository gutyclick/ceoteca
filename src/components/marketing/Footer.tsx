import { Logo } from "@/components/ui/Logo";
import { siteConfig } from "@/config/site";

const footerLinks = [
  { href: "/biblioteca", label: "Biblioteca" },
  { href: "/pricing", label: "Precios" },
  { href: "/registro", label: "Registro" },
] as const;

const legalLinks = [
  { href: "/terminos", label: "Términos" },
  { href: "/privacidad", label: "Privacidad" },
  { href: `mailto:${siteConfig.supportEmail}`, label: "Soporte" },
] as const;

const currentYear = 2026;

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background-soft">
      <div className="ceoteca-container grid gap-10 py-12 md:grid-cols-[1.3fr_0.7fr_0.7fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xl text-sm leading-6 text-text-secondary">
            Contenido educativo y editorial propio. Ceoteca no está afiliada a
            autores ni editoriales.
          </p>
          <p className="text-xs text-text-muted">
            Métricas y testimonios representativos hasta contar con datos
            verificados de uso.
          </p>
        </div>
        <nav aria-label="Producto" className="grid content-start gap-3">
          <p className="text-sm font-semibold">Producto</p>
          {footerLinks.map((item) => (
            <a
              className="text-sm text-text-secondary transition hover:text-text-primary"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <nav aria-label="Legal y soporte" className="grid content-start gap-3">
          <p className="text-sm font-semibold">Legal</p>
          {legalLinks.map((item) => (
            <a
              className="text-sm text-text-secondary transition hover:text-text-primary"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10 py-5">
        <div className="ceoteca-container text-xs text-text-muted">
          © {currentYear} Ceoteca. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
