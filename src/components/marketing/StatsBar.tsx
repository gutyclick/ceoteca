import { productStats } from "@/data/landing";
import { cn } from "@/lib/utils/cn";

export function StatsBar() {
  return (
    <section className="ceoteca-container pb-20">
      <div className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-surface-gradient p-4 shadow-ambient md:grid-cols-4">
        {productStats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              className="flex items-center gap-4 rounded-[1.1rem] p-3 md:border-r md:border-white/10 md:last:border-r-0"
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
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-sm text-text-secondary">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
