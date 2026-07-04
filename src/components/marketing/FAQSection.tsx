"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { landingFaqs } from "@/data/landing";
import { cn } from "@/lib/utils/cn";

import { SectionHeading } from "./SectionHeading";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="ceoteca-container pb-20">
      <SectionHeading
        eyebrow="Preguntas frecuentes"
        title="Resolvemos tus dudas"
        description="Lo esencial sobre contenido, planes, ejercicios y propiedad intelectual."
      />
      <div className="mx-auto mt-12 grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.8fr]">
        <div className="overflow-hidden rounded-[1.25rem] border border-slate-950/[0.08] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
          {landingFaqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div className="border-b border-slate-950/[0.06] last:border-b-0" key={faq.question}>
                <button
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  type="button"
                >
                  <span className="font-black text-slate-950">{faq.question}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "shrink-0 text-slate-400 transition",
                      isOpen && "rotate-180 text-violet-600",
                    )}
                    size={20}
                  />
                </button>
                {isOpen ? (
                  <div className="px-5 pb-5 text-sm leading-7 text-slate-600">
                    {faq.answer}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <aside className="rounded-[1.25rem] border border-slate-950/[0.08] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
          <h3 className="text-2xl font-black text-slate-950">
            ¿Lista para aplicar lo que aprendes?
          </h3>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Únete a miles de personas que convierten lectura en acción todos los días.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-700">
            {[
              "Acceso a toda la biblioteca",
              "Nuevos análisis cada semana",
              "7 días gratis, luego planes desde USD 5/mes",
            ].map((item) => (
              <li className="flex items-center gap-2" key={item}>
                <Check aria-hidden="true" className="text-violet-600" size={17} />
                {item}
              </li>
            ))}
          </ul>
          <ButtonLink className="mt-7" href="/registro">
            Empieza gratis
          </ButtonLink>
        </aside>
      </div>
    </section>
  );
}
