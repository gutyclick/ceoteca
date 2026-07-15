import { TrainingPageShell } from "@/components/training/TrainingPageShell";

const blocks = ["h-44", "h-28", "h-56", "h-36"];
export default function TrainingLoading() {
  return (
    <TrainingPageShell
      description="Preparando tu espacio de práctica."
      search={false}
      title="Training"
    >
      <div
        aria-busy="true"
        aria-label="Cargando Training"
        className="space-y-6"
      >
        {blocks.map((height, index) => (
          <div
            className={`${height} animate-pulse rounded-[8px] border border-slate-200 bg-slate-100 motion-reduce:animate-none`}
            key={index}
          />
        ))}
      </div>
    </TrainingPageShell>
  );
}
