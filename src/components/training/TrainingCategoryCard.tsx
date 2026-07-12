import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TrainingIcon, TrainingProgressBar } from "@/components/training/TrainingPrimitives";
import type { TrainingCategory } from "@/types/training";

export function TrainingCategoryCard({ category }: { category: TrainingCategory }) {
  return <Link className="group flex min-h-[190px] flex-col rounded-[8px] border border-slate-950/[0.08] bg-white p-4 transition-colors hover:border-violet-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 motion-reduce:transition-none" href={`/ejercicios?categoria=${category.id}`}><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-[8px] border border-violet-100 bg-violet-50 text-violet-700"><TrainingIcon icon={category.icon} size={23} /></span><div className="min-w-0"><h3 className="text-sm font-black text-slate-950">{category.name}</h3><p className="mt-1 text-xs font-semibold text-slate-500">Dominio {category.mastery}%</p></div></div><div className="mt-4"><TrainingProgressBar label={category.name} value={category.mastery} /></div><p className="mt-4 text-xs leading-5 text-slate-500">Recomendado:<br /><span className="font-semibold text-slate-700">{category.recommendation}</span></p><span className="mt-auto inline-flex items-center justify-end gap-1 text-xs font-bold text-violet-700">Explorar <ArrowRight className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" size={14} /></span></Link>;
}
