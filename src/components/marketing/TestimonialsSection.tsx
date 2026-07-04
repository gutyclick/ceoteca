import { Quote } from "lucide-react";

import { audienceCards } from "@/data/landing";

import { SectionHeading } from "./SectionHeading";

export function TestimonialsSection() {
  return (
    <section className="ceoteca-container pb-20">
      <SectionHeading
        eyebrow="Para quién es"
        title="Personas que aplican lo que aprenden"
        description="Ceoteca está pensada para lectores, emprendedores y profesionales que quieren convertir ideas en mejores decisiones."
      />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {audienceCards.map((testimonial) => (
          <article
            className="rounded-[1.2rem] border border-slate-950/[0.08] bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.05)]"
            key={testimonial.name}
          >
            <Quote aria-hidden="true" className="text-violet-500" size={26} />
            <p className="mt-5 text-pretty text-sm leading-7 text-slate-700">
              “{testimonial.quote}”
            </p>
            <div className="mt-7 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-sm font-black text-white">
                {testimonial.name.slice(0, 1)}
              </span>
              <div>
                <p className="font-black text-slate-950">{testimonial.name}</p>
                <p className="text-sm text-slate-500">{testimonial.role}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-8 flex justify-center gap-2">
        <span className="h-2 w-2 rounded-full bg-violet-600" />
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        <span className="h-2 w-2 rounded-full bg-slate-300" />
      </div>
    </section>
  );
}
