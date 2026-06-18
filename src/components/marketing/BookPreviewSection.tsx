import { Clock3, Sparkles } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { previewBooks } from "@/data/landing";
import { cn } from "@/lib/utils/cn";

import { SectionHeading } from "./SectionHeading";

export function BookPreviewSection() {
  return (
    <section className="ceoteca-container pb-20">
      <SectionHeading
        eyebrow="Vista previa"
        title="Portadas conceptuales, no oficiales."
        description="Cada libro usa una identidad visual propia y contenido editorial original."
      />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {previewBooks.map((book) => (
          <Card className="overflow-hidden p-0" interactive key={book.title}>
            <div
              className={cn(
                "relative min-h-[300px] overflow-hidden bg-gradient-to-br p-6",
                book.accent,
              )}
            >
              <div className="absolute inset-0 bg-black/35" />
              <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full border border-white/30" />
              <div className="absolute bottom-8 left-8 h-24 w-24 rounded-full bg-white/20 blur-xl" />
              <div className="relative z-10 flex h-full min-h-[252px] flex-col justify-between">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/75">
                  {book.category}
                </p>
                <div>
                  <h3 className="text-balance text-3xl font-semibold leading-tight text-white">
                    {book.title}
                  </h3>
                  <p className="mt-3 text-sm text-white/75">{book.author}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-white/80">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2">
                    <Clock3 aria-hidden="true" size={14} />
                    {book.duration}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2">
                    <Sparkles aria-hidden="true" size={14} />
                    Editorial
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
