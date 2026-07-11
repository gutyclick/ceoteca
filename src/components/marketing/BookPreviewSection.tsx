import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import { bookIconMap, previewBooks } from "@/data/landing";
import { cn } from "@/lib/utils/cn";

export function BookPreviewSection() {
  return (
    <section className="ceoteca-container pb-20">
      <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-600">
            Biblioteca destacada
          </p>
          <h2 className="mt-3 text-balance text-4xl font-black tracking-[-0.03em] text-slate-950">
            Ideas de libros, llevadas a la práctica
          </h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            Cada análisis incluye ideas clave, marcos visuales y ejercicios.
          </p>
        </div>
        <ButtonLink
          className="border-slate-950/10 bg-white font-black text-slate-800 shadow-none hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800"
          href="/biblioteca"
          variant="secondary"
        >
          Ver toda la biblioteca
        </ButtonLink>
      </div>

      <div className="relative">
        <button
          aria-label="Ver libros anteriores"
          className="absolute -left-5 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-slate-950/[0.08] bg-white text-slate-500 shadow-sm lg:grid"
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={20} />
        </button>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {previewBooks.map((book) => {
            const Icon =
              bookIconMap[book.pattern as keyof typeof bookIconMap] ??
              bookIconMap.default;

            return (
              <article
                className="group relative overflow-hidden rounded-[1.2rem] border border-slate-950/[0.08] bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.10)] transition duration-300 hover:-translate-y-1 hover:border-violet-200"
                key={book.title}
              >
                <div
                  className={cn(
                    "relative aspect-[3/4] overflow-hidden rounded-[0.95rem] bg-gradient-to-br",
                    book.accent,
                  )}
                >
                  {book.imagePath ? (
                    <Image
                      alt={`Portada editorial de ${book.title}`}
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      fill
                      sizes="(min-width: 1024px) 220px, (min-width: 640px) 45vw, 88vw"
                      src={book.imagePath}
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-slate-950/20" />
                      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full border border-white/20" />
                      <Icon
                        aria-hidden="true"
                        className="absolute bottom-7 right-6 text-white/18 transition group-hover:scale-110"
                        size={72}
                      />
                    </>
                  )}
                </div>
                <div className="pt-4">
                  <h3 className="line-clamp-2 text-lg font-black leading-tight text-slate-950">
                    {book.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">{book.author}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
                      {book.duration}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                      {book.category}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <button
          aria-label="Ver más libros"
          className="absolute -right-5 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-slate-950/[0.08] bg-white text-slate-500 shadow-sm lg:grid"
          type="button"
        >
          <ChevronRight aria-hidden="true" size={20} />
        </button>
      </div>

      <div className="mt-10 text-center">
        <ButtonLink
          className="font-black text-violet-700 hover:bg-violet-50 hover:text-violet-900"
          href="/biblioteca"
          variant="ghost"
        >
          Explorar por categorías
          <ArrowRight aria-hidden="true" size={17} />
        </ButtonLink>
      </div>
    </section>
  );
}
