import { Quote } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { demoTestimonials } from "@/data/landing";

import { SectionHeading } from "./SectionHeading";

export function TestimonialsSection() {
  return (
    <section className="ceoteca-container pb-20">
      <SectionHeading
        eyebrow="Testimonios demo"
        title="Señales representativas del usuario ideal."
        description="Estos testimonios son ejemplos demo para validar tono y diseño antes de contar con reseñas reales."
      />
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {demoTestimonials.map((testimonial) => (
          <Card className="p-6" key={testimonial.name}>
            <Quote aria-hidden="true" className="text-brand-pink" size={26} />
            <p className="mt-5 text-pretty text-sm leading-7 text-text-secondary">
              “{testimonial.quote}”
            </p>
            <div className="mt-6">
              <p className="font-semibold">{testimonial.name}</p>
              <p className="mt-1 text-sm text-text-muted">{testimonial.role}</p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
