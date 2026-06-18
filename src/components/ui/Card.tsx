import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
};

export function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-white/10 bg-surface-gradient shadow-ambient",
        interactive &&
          "transition duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.055]",
        className,
      )}
      {...props}
    />
  );
}
