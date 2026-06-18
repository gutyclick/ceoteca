import { Logo } from "@/components/ui/Logo";
import { siteConfig } from "@/config/site";

const footerLinks = [
  { href: "/terminos", label: "Terminos" },
  { href: "/privacidad", label: "Privacidad" },
  { href: `mailto:${siteConfig.supportEmail}`, label: "Soporte" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background-soft">
      <div className="ceoteca-container flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xl text-sm leading-6 text-text-secondary">
            Contenido educativo y editorial propio. Ceoteca no esta afiliada a
            autores ni editoriales.
          </p>
        </div>
        <nav aria-label="Enlaces secundarios" className="flex flex-wrap gap-4">
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
      </div>
    </footer>
  );
}
