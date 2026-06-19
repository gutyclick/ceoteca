import { Bot, CheckCircle2 } from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { aiQuestion, chatBenefits, chatSteps } from "@/data/landing";

export function AiGuidanceSection() {
  const QuestionIcon = aiQuestion.icon;

  return (
    <section className="ceoteca-container pb-8">
      <Card className="relative overflow-hidden p-6 md:p-10 lg:p-14">
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-glow-violet blur-3xl" />
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div className="relative z-10">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-text-secondary">
              <Bot aria-hidden="true" className="text-brand-purple" size={18} />
              Habla con el conocimiento
            </p>
            <h2 className="mt-6 max-w-lg text-balance text-4xl font-semibold leading-tight sm:text-5xl">
              Pregunta, compara
              <span className="block text-gradient-brand">y aplica.</span>
            </h2>
            <p className="mt-5 max-w-md text-pretty leading-7 text-text-secondary">
              La IA de Ceoteca esta pensada para trabajar con el contenido de la
              biblioteca: recomienda libros, aterriza ideas y te ayuda a decidir
              que hacer despues.
            </p>
            <ul className="mt-7 space-y-3">
              {chatBenefits.map((benefit) => (
                <li
                  className="flex items-center gap-3 text-sm text-text-primary"
                  key={benefit}
                >
                  <CheckCircle2
                    aria-hidden="true"
                    className="text-brand-purple"
                    size={18}
                  />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 mx-auto w-full max-w-xl">
            <div className="ml-auto flex max-w-md items-start gap-3 rounded-[1.25rem] rounded-tr-sm border border-white/10 bg-white/[0.055] p-4 text-sm leading-6 text-text-primary">
              <QuestionIcon
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-brand-pink"
                size={18}
              />
              <p>{aiQuestion.text}</p>
            </div>

            <div className="pulse-glow mt-5 rounded-[1.75rem] border border-white/10 bg-surface-raised/95 p-6 shadow-ambient">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl border border-brand-purple/50 bg-brand-purple/15 text-brand-purple">
                  <Bot aria-hidden="true" size={24} />
                </span>
                <p className="text-sm leading-6 text-text-secondary">
                  Basado en tus objetivos, Ceoteca puede recomendarte una ruta
                  de lectura y aplicacion:
                </p>
              </div>
              <ol className="space-y-4">
                {chatSteps.map((step, index) => (
                  <li className="flex gap-3 text-sm leading-6" key={step}>
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-purple/30 text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <span className="text-text-primary">{step}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-5 text-sm leading-6 text-text-secondary">
                Tambien puedes pedir una rutina de 7 dias, una comparacion entre
                libros o una recomendacion segun tu situacion.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <ButtonLink href="/registro" variant="secondary">
                Crear cuenta
              </ButtonLink>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
