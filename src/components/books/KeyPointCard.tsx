import { CheckCircle2 } from "lucide-react";

import { Card } from "@/components/ui/Card";
import type { KeyPoint } from "@/types";

type KeyPointCardProps = {
  point: KeyPoint;
};

export function KeyPointCard({ point }: KeyPointCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-purple/20 font-semibold text-brand-purple">
          {point.number}
        </span>
        <div>
          <h3 className="text-xl font-semibold">{point.title}</h3>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            {point.explanation}
          </p>
          <div className="mt-4 grid gap-3 text-sm leading-6">
            <p>
              <span className="text-text-primary">Ejemplo:</span>{" "}
              <span className="text-text-secondary">{point.example}</span>
            </p>
            <p className="flex gap-2 text-text-secondary">
              <CheckCircle2
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-success"
                size={17}
              />
              {point.action}
            </p>
            <p>
              <span className="text-text-primary">Limitación:</span>{" "}
              <span className="text-text-secondary">{point.limitation}</span>
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
