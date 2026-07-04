import { comparisonRows, whyCeotecaItems } from "@/data/landing";
import { cn } from "@/lib/utils/cn";

import { SectionHeading } from "./SectionHeading";

export function ComparisonSection() {
  return (
    <section className="ceoteca-container pb-20">
      <SectionHeading
        eyebrow="Por qué Ceoteca"
        title="Más contexto. Más claridad. Más acción."
        description="Una experiencia pensada para complementar tus lecturas y ayudarte a aplicar mejor."
      />
      <div className="mt-12 grid gap-6 md:grid-cols-4">
        {whyCeotecaItems.map((item) => {
          const Icon = item.icon;

          return (
            <article className="text-center" key={item.title}>
              <span
                className={cn(
                  "mx-auto grid h-14 w-14 place-items-center rounded-full border border-slate-950/[0.06] shadow-[0_18px_42px_rgba(15,23,42,0.08)]",
                  item.accent,
                )}
              >
                <Icon aria-hidden="true" size={24} />
              </span>
              <h3 className="mt-4 font-black text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </article>
          );
        })}
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {comparisonRows.map((row) => (
          <article
            className="rounded-[1.2rem] border border-slate-950/[0.08] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.05)]"
            key={row.feature}
          >
            <h3 className="font-black text-slate-950">{row.feature}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{row.ceoteca}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
