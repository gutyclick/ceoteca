import Link from "next/link";
import { ArrowRight, MessagesSquare } from "lucide-react";

import { DashboardAccountMenu } from "@/components/app/DashboardAccountMenu";
import { DashboardSidebar } from "@/components/app/DashboardSidebar";
import { NotificationBell } from "@/components/app/NotificationBell";
import { ContinueTrainingCard } from "@/components/training/ContinueTrainingCard";
import { SkillProgressRow } from "@/components/training/TrainingPrimitives";
import { TrainingCategoryCard } from "@/components/training/TrainingCategoryCard";
import { TrainingHeroCard } from "@/components/training/TrainingHeroCard";
import { continueTraining, skillProgress, todayTraining, trainingCategories } from "@/data/training";

export function TrainingView() {
  const skillColumns = [skillProgress.slice(0, 3), skillProgress.slice(3)];

  return (
    <main className="min-h-screen w-full min-w-0 max-w-full overflow-x-clip bg-[#fbfaf8] text-slate-950 [padding-left:var(--dashboard-sidebar-offset,292px)] max-sm:!pl-0">
      <DashboardSidebar active="training" tone="light" />
      <div className="mx-auto w-full max-w-[1560px] px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <header className="flex min-h-16 min-w-0 items-start justify-between gap-3 border-b border-slate-950/[0.08] pb-5 pl-14 sm:pl-0">
          <div>
            <h1 className="text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">Ejercicios</h1>
            <p className="mt-1 text-sm text-slate-500">Entrena lo que aprendes y conviértelo en criterio.</p>
          </div>
          <div className="flex shrink-0 items-center gap-3"><NotificationBell tone="light" /><DashboardAccountMenu /></div>
        </header>

        <div className="mt-6 space-y-7">
          <TrainingHeroCard recommendation={todayTraining} />

          <section className="grid gap-4 rounded-[8px] border border-violet-200 bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6" aria-labelledby="roleplay-title">
            <div className="flex min-w-0 items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-[8px] bg-violet-50 text-violet-700"><MessagesSquare size={23}/></div><div><h2 className="text-xl font-black" id="roleplay-title">Simulaciones conversacionales</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Practica ventas, liderazgo, negociación y decisiones empresariales con personajes guiados. Recibe una evaluación basada en momentos concretos de la conversación.</p></div></div>
            <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-violet-600 px-5 text-sm font-bold text-white hover:bg-violet-700" href="/ejercicios/simulaciones">Abrir simulaciones <ArrowRight size={17}/></Link>
          </section>

          <section aria-labelledby="continue-title">
            <h2 className="text-xl font-black" id="continue-title">Continúa donde lo dejaste</h2>
            <div className="mt-3 grid gap-4 xl:grid-cols-2">{continueTraining.map((activity) => <ContinueTrainingCard activity={activity} key={activity.id} />)}</div>
          </section>

          <section aria-labelledby="categories-title">
            <h2 className="text-xl font-black" id="categories-title">Explora por categoría</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{trainingCategories.map((category) => <TrainingCategoryCard category={category} key={category.id} />)}</div>
          </section>

          <section aria-labelledby="progress-title" className="rounded-[8px] border border-slate-950/[0.08] bg-white p-5 sm:p-6">
            <h2 className="text-xl font-black" id="progress-title">Tu progreso</h2>
            <div className="mt-5 grid gap-6 xl:grid-cols-2 xl:divide-x xl:divide-slate-950/[0.08]">
              {skillColumns.map((column, index) => <div className={`space-y-5 ${index === 1 ? "xl:pl-6" : ""}`} key={column[0]?.id}>{column.map((skill) => <SkillProgressRow key={skill.id} skill={skill} />)}</div>)}
            </div>
            <div className="mt-6 flex justify-center"><Link className="inline-flex min-h-11 items-center gap-2 rounded-[8px] px-4 text-sm font-bold text-violet-700 hover:bg-violet-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600" href="/perfil">Ver progreso completo <ArrowRight size={16} /></Link></div>
          </section>
        </div>
      </div>
    </main>
  );
}
