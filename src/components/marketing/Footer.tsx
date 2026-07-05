import { Instagram, Linkedin, Send, Twitter } from "lucide-react";

import { Logo } from "@/components/ui/Logo";
import { siteConfig } from "@/config/site";

const productLinks = [
  { href: "/biblioteca", label: "Biblioteca" },
  { href: "/biblioteca?categoria=all", label: "Categorías" },
  { href: "/pricing", label: "Precios" },
  { href: "/registro", label: "Novedades" },
] as const;

const resourceLinks = [
  { href: "/biblioteca", label: "Guías" },
  { href: "/pricing", label: "Plantillas" },
  { href: "/biblioteca", label: "Recomendaciones" },
] as const;

const companyLinks = [
  { href: "/", label: "Sobre nosotros" },
  { href: `mailto:${siteConfig.supportEmail}`, label: "Contacto" },
  { href: "/terminos", label: "Términos" },
  { href: "/privacidad", label: "Privacidad" },
] as const;

const currentYear = 2026;

export function Footer() {
  return (
    <footer className="border-t border-slate-950/[0.06] bg-[#fbfaf8]">
      <div className="ceoteca-container grid gap-10 py-14 md:grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr_1fr]">
        <div className="space-y-4">
          <Logo className="text-slate-950" useBrandAsset />
          <p className="max-w-xs text-sm leading-6 text-slate-600">
            Análisis originales de libros para personas que quieren aprender más y aplicar mejor.
          </p>
          <div className="flex gap-2 text-slate-500">
            {[Twitter, Instagram, Linkedin].map((Icon, index) => (
              <span
                className="grid h-8 w-8 place-items-center rounded-full border border-slate-950/[0.08] bg-white"
                key={index}
              >
                <Icon aria-hidden="true" size={15} />
              </span>
            ))}
          </div>
        </div>

        <FooterColumn label="Producto" links={productLinks} />
        <FooterColumn label="Recursos" links={resourceLinks} />
        <FooterColumn label="Compañía" links={companyLinks} />

        <div>
          <p className="text-sm font-black text-slate-950">Newsletter</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Ideas prácticas cada semana.
          </p>
          <form className="mt-4 flex overflow-hidden rounded-xl border border-slate-950/[0.08] bg-white">
            <input
              aria-label="Correo para newsletter"
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-slate-700 outline-none"
              placeholder="tu@email.com"
              type="email"
            />
            <button
              aria-label="Suscribirme"
              className="grid w-12 place-items-center text-violet-600"
              type="button"
            >
              <Send aria-hidden="true" size={17} />
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-slate-950/[0.06] py-5">
        <div className="ceoteca-container text-center text-xs text-slate-500">
          © {currentYear} Ceoteca. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  label,
  links,
}: {
  label: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <nav aria-label={label} className="grid content-start gap-3">
      <p className="text-sm font-black text-slate-950">{label}</p>
      {links.map((item) => (
        <a
          className="text-sm text-slate-600 transition hover:text-violet-700"
          href={item.href}
          key={item.label}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
