import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  ListChecks,
  Signal,
} from "lucide-react";
import type { TrainingSession } from "@/types/training-engine";

export function SessionIntro({
  session,
  restored,
  onBack,
  onStart,
}: {
  session: TrainingSession;
  restored: boolean;
  onBack: () => void;
  onStart: () => void;
}) {
  return (
    <main className="min-h-[calc(100vh-80px)] w-full bg-[#fbfaf8] px-4 py-10 text-slate-950 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-4xl">
      <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700">
        {session.category}
      </span>
      <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
        {session.title}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
        {session.description}
      </p>
      <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold text-slate-500">
        <span className="inline-flex items-center gap-2">
          <ListChecks size={17} />
          {session.exercises.length} ejercicios
        </span>
        <span className="inline-flex items-center gap-2">
          <Clock3 size={17} />
          {session.estimatedMinutes} minutos
        </span>
        <span className="inline-flex items-center gap-2">
          <Signal size={17} />
          Nivel intermedio
        </span>
      </div>
      {restored ? (
        <p className="mt-5 rounded-[8px] border border-violet-200 bg-violet-50 p-4 text-sm font-semibold text-violet-900">
          Tu progreso anterior está listo. Continuarás desde el ejercicio
          guardado.
        </p>
      ) : null}
      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_310px]">
        <section className="rounded-[8px] border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-black">Qué vas a entrenar</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {session.skills.map((skill) => (
              <li
                className="flex items-center gap-3 text-sm font-semibold"
                key={skill}
              >
                <span className="h-2 w-2 rounded-full bg-violet-600" />
                {skill}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-[8px] border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-black">Basado en</h2>
          <div className="mt-4 flex gap-3">
            {session.sourceBooks.map((book) => (
              <div
                className="relative aspect-[3/4] w-16 overflow-hidden rounded-[6px] border border-slate-200"
                key={book.id}
              >
                <Image
                  alt={`Portada de ${book.title}`}
                  className="object-cover"
                  fill
                  sizes="64px"
                  src={book.imagePath}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] px-5 font-bold text-slate-600 hover:bg-slate-100"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={17} />
          Volver
        </button>
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] bg-violet-700 px-7 font-bold text-white hover:bg-violet-800"
          onClick={onStart}
          type="button"
        >
          {restored ? "Continuar sesión" : "Comenzar"}
          <ArrowRight size={17} />
        </button>
      </div>
      </div>
    </main>
  );
}
