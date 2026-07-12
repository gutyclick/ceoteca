import { X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export function SessionHeader({
  current,
  total,
  onExit,
}: {
  current: number;
  total: number;
  onExit: () => void;
}) {
  const progress = total ? Math.round((current / total) * 100) : 0;
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-[#fbfaf8]/95 text-slate-950 backdrop-blur">
      <div className="mx-auto flex min-h-20 max-w-6xl items-center gap-5 px-4 sm:px-6">
        <Logo useBrandAsset />
        <div className="min-w-0 flex-1">
          <div
            aria-label={`Progreso: ${progress}%`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress}
            className="h-2 overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-violet-600 transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <button
          className="inline-flex min-h-11 items-center gap-2 rounded-[8px] px-3 text-sm font-bold text-slate-600 hover:bg-slate-100"
          onClick={onExit}
          type="button"
        >
          <X size={18} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}
