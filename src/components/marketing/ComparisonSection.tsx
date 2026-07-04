import { whyCeotecaItems } from "@/data/landing";
import { cn } from "@/lib/utils/cn";

import { SectionHeading } from "./SectionHeading";

export function ComparisonSection() {
  return (
    <section
      className="mx-auto w-full max-w-[1480px] px-6 pb-20 sm:px-8 xl:px-10"
      id="por-que-ceoteca"
    >
      <SectionHeading
        eyebrow="Por qué Ceoteca"
        title="Más contexto. Más claridad. Más acción."
        description="Una experiencia pensada para complementar tus lecturas y ayudarte a aplicar mejor."
      />
      <div className="mt-12 grid gap-8 md:grid-cols-4">
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
              <p className="mx-auto mt-2 max-w-[240px] text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
