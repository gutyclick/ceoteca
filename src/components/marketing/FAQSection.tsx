"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { Card } from "@/components/ui/Card";
import { landingFaqs } from "@/data/landing";
import { cn } from "@/lib/utils/cn";

import { SectionHeading } from "./SectionHeading";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="ceoteca-container pb-20">
      <SectionHeading
        eyebrow="FAQ"
        title="Preguntas antes de empezar."
        description="Lo esencial sobre contenido, modo demo, integraciones y alcance del producto."
      />
      <div className="mx-auto mt-12 max-w-3xl space-y-3">
        {landingFaqs.map((faq, index) => {
          const isOpen = openIndex === index;

          return (
            <Card className="p-0" key={faq.question}>
              <button
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 p-5 text-left"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                type="button"
              >
                <span className="font-semibold">{faq.question}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "shrink-0 text-text-secondary transition",
                    isOpen && "rotate-180 text-brand-purple",
                  )}
                  size={20}
                />
              </button>
              {isOpen ? (
                <div className="px-5 pb-5 text-sm leading-7 text-text-secondary">
                  {faq.answer}
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
