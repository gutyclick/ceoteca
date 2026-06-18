import { Lock } from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type LockedFeatureProps = {
  title: string;
  description: string;
};

export function LockedFeature({ title, description }: LockedFeatureProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-warning/15 text-warning">
          <Lock aria-hidden="true" size={20} />
        </span>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            {description}
          </p>
          <ButtonLink className="mt-4" href="/planes" size="sm" variant="secondary">
            Ver planes
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}
