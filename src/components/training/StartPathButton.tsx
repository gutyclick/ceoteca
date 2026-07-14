"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { startLearningPath } from "@/lib/training/api-client";

export function StartPathButton({ pathSlug }: { pathSlug: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function start() {
    setState("loading");
    try {
      const result = await startLearningPath(pathSlug);
      router.push(result.nextHref);
      router.refresh();
    } catch {
      setState("error");
    }
  }

  return (
    <div>
      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-violet-600 px-5 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-60"
        disabled={state === "loading"}
        onClick={start}
        type="button"
      >
        {state === "loading" ? (
          <Loader2
            className="animate-spin motion-reduce:animate-none"
            size={17}
          />
        ) : null}
        Empezar ruta <ArrowRight size={17} />
      </button>
      {state === "error" ? (
        <p className="mt-2 text-sm text-rose-700" role="alert">
          No pudimos iniciar la ruta. Revisa tu acceso e inténtalo de nuevo.
        </p>
      ) : null}
    </div>
  );
}
