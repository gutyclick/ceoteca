import Image from "next/image";
import { BarChart3, CalendarCheck2, Check, Crown, Leaf, Lock, Megaphone, Rocket, Target } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import type { SkillProgress, TrainingIconKey, TrainingStatus, WeeklyStreakData } from "@/types/training";

const iconMap = { target: Target, calendar: CalendarCheck2, megaphone: Megaphone, leaf: Leaf, crown: Crown, chart: BarChart3, rocket: Rocket } as const;

export function TrainingIcon({ icon, size = 24 }: { icon: TrainingIconKey; size?: number }) {
  const Icon = iconMap[icon];
  return <Icon aria-hidden="true" size={size} />;
}

export function TrainingProgressBar({ value, label }: { value: number; label: string }) {
  const normalized = Math.min(100, Math.max(0, value));
  return <div aria-label={`${label}: ${normalized}%`} aria-valuemax={100} aria-valuemin={0} aria-valuenow={normalized} className="h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar"><div className="h-full rounded-full bg-violet-600 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${normalized}%` }} /></div>;
}

const statusConfig: Record<TrainingStatus, { label: string; className: string }> = {
  not_started: { label: "Sin iniciar", className: "bg-slate-100 text-slate-600" },
  in_progress: { label: "En progreso", className: "bg-violet-50 text-violet-700" },
  completed: { label: "Completado", className: "bg-emerald-50 text-emerald-700" },
  needs_review: { label: "Por reforzar", className: "bg-amber-50 text-amber-700" },
  locked: { label: "Bloqueado", className: "bg-slate-100 text-slate-500" },
  loading: { label: "Cargando", className: "bg-slate-100 text-slate-500" },
  error: { label: "No disponible", className: "bg-rose-50 text-rose-700" },
};

export function TrainingStatusChip({ status }: { status: TrainingStatus }) {
  const config = statusConfig[status];
  return <span className={cn("inline-flex min-h-7 items-center rounded-full px-3 text-xs font-bold", config.className)}>{status === "locked" ? <Lock className="mr-1.5" size={13} /> : null}{config.label}</span>;
}

export function WeeklyStreak({ data }: { data: WeeklyStreakData }) {
  return <section aria-label={`Racha semanal: ${data.completedDays} días`} className="rounded-[8px] border border-slate-950/[0.08] bg-slate-50/70 p-4"><p className="text-sm font-black text-slate-800">Racha semanal</p><p className="mt-1 text-2xl font-black text-slate-950">{data.completedDays} días</p><div className="mt-3 grid grid-cols-7 gap-2">{data.days.map((day, index) => <span className="grid justify-items-center gap-1.5 text-[11px] font-bold text-slate-500" key={`${day.label}-${index}`}><span className={cn("grid h-5 w-5 place-items-center rounded-full", day.completed ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400")}>{day.completed ? <Check aria-label="Completado" size={12} strokeWidth={3} /> : null}</span>{day.label}</span>)}</div></section>;
}

export function BookThumbnailGroup({ books }: { books: Array<{ title: string; imagePath: string }> }) {
  return <div aria-label="Libros incluidos en el entrenamiento" className="flex items-end justify-center gap-2">{books.map((book, index) => <div className={cn("relative aspect-[3/4] w-14 overflow-hidden rounded-[6px] border border-slate-950/[0.10] bg-slate-100 sm:w-16", index === 1 && "sm:w-[70px]")} key={book.title}><Image alt={`Portada de ${book.title}`} className="object-cover" fill sizes="70px" src={book.imagePath} /></div>)}</div>;
}

const skillTone: Record<SkillProgress["level"], string> = { Competente: "bg-emerald-50 text-emerald-700", "Por reforzar": "bg-amber-50 text-amber-700", "En desarrollo": "bg-blue-50 text-blue-700", Descubriendo: "bg-slate-100 text-slate-500" };

export function SkillProgressRow({ skill }: { skill: SkillProgress }) {
  return <div className="grid gap-2 sm:grid-cols-[140px_minmax(100px,1fr)_44px_112px] sm:items-center sm:gap-4"><span className="text-sm font-semibold text-slate-700">{skill.label}</span><TrainingProgressBar label={skill.label} value={skill.progress} /><span className="text-sm font-bold text-slate-600">{skill.progress}%</span><span className={cn("w-fit rounded-full px-3 py-1.5 text-xs font-bold", skillTone[skill.level])}>{skill.level}</span></div>;
}
