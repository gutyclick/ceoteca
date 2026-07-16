import { Suspense } from "react";

import { TrainingPageShell } from "@/components/training/TrainingPageShell";
import { TrainingGlobalSearch } from "@/components/training/search/TrainingGlobalSearch";

export default function TrainingSearchPage() {
  return (
    <TrainingPageShell
      description="Encuentra contenido publicado y disponible para tu plan."
      search={false}
      title="Buscar en Training"
    >
      <Suspense
        fallback={
          <div className="h-64 animate-pulse rounded-[8px] bg-slate-100" />
        }
      >
        <TrainingGlobalSearch />
      </Suspense>
    </TrainingPageShell>
  );
}
