import { CheckCircle2, MinusCircle } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { comparisonRows } from "@/data/landing";

import { SectionHeading } from "./SectionHeading";

export function ComparisonSection() {
  return (
    <section className="ceoteca-container pb-20">
      <SectionHeading
        eyebrow="Comparativa"
        title="Más que un resumen plano."
        description="Ceoteca combina lectura breve, aplicación práctica, progreso y preguntas contextuales por libro."
      />
      <Card className="mt-12 overflow-hidden p-0">
        <div className="grid border-b border-white/10 bg-white/[0.04] p-5 text-sm font-semibold text-text-secondary md:grid-cols-[1.1fr_1fr_1fr]">
          <span>Funcion</span>
          <span>Ceoteca</span>
          <span>Lectura tradicional</span>
        </div>
        {comparisonRows.map((row) => (
          <div
            className="grid gap-4 border-b border-white/10 p-5 last:border-b-0 md:grid-cols-[1.1fr_1fr_1fr] md:items-center"
            key={row.feature}
          >
            <p className="font-medium">{row.feature}</p>
            <p className="flex items-center gap-2 text-sm text-text-secondary">
              <CheckCircle2
                aria-hidden="true"
                className="text-success"
                size={18}
              />
              {row.ceoteca}
            </p>
            <p className="flex items-center gap-2 text-sm text-text-secondary">
              <MinusCircle
                aria-hidden="true"
                className="text-text-muted"
                size={18}
              />
              {row.traditional}
            </p>
          </div>
        ))}
      </Card>
    </section>
  );
}
