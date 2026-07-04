import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";

import { finalCta } from "@/data/landing";

export function FinalCTASection() {
  return (
    <section className="mx-auto w-full max-w-[1480px] px-6 pb-20 sm:px-8 xl:px-10">
      <div className="relative overflow-hidden rounded-[1.35rem] bg-gradient-to-r from-[#6d28d9] via-[#7c3aed] to-[#9333ea] px-8 py-10 text-white shadow-[0_28px_90px_rgba(109,40,217,0.22)] md:px-12">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/12 blur-2xl" />
        <div className="relative z-10 grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex gap-5">
            <span className="hidden h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 md:grid">
              <BookOpen aria-hidden="true" size={28} />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-100">
                {finalCta.eyebrow}
              </p>
              <h2 className="mt-2 max-w-xl text-3xl font-black leading-tight md:text-4xl">
                {finalCta.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-violet-50">
                {finalCta.description}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-black text-violet-700 shadow-[0_18px_45px_rgba(15,23,42,0.16)] transition hover:bg-violet-50"
              href={finalCta.primary.href}
            >
              {finalCta.primary.label}
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 text-sm font-black text-white transition hover:bg-white/15"
              href={finalCta.secondary.href}
            >
              {finalCta.secondary.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
