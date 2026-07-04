import { productStats } from "@/data/landing";
import { cn } from "@/lib/utils/cn";

export function StatsBar() {
  return (
    <section className="ceoteca-container pb-20">
      <div className="grid gap-3 rounded-[1.5rem] border border-slate-950/[0.08] bg-white/85 p-4 shadow-[0_20px_70px_rgba(15,23,42,0.06)] md:grid-cols-4">
        {productStats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              className="flex items-center gap-4 rounded-[1.1rem] p-4 md:border-r md:border-slate-950/[0.06] md:last:border-r-0"
              key={stat.label}
            >
              <span
                className={cn(
                  "grid h-14 w-14 shrink-0 place-items-center rounded-2xl",
                  stat.background,
                  stat.accent,
                )}
              >
                <Icon aria-hidden="true" size={26} />
              </span>
              <div>
                <p className={cn("text-3xl font-black", stat.valueClass)}>
                  {stat.value}
                </p>
                <p className="text-sm font-medium text-slate-600">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
