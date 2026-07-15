"use client";

import { ArrowRight, Loader2, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  acceptAdaptiveRecommendation,
  getAdaptiveRecommendation,
  getTrainingNavigationSkill,
  trackTrainingNavigationEvent,
} from "@/lib/training/api-client";
import type { TrainingAccessState } from "@/lib/training/navigation-model";

export function StartSkillTrainingButton({
  skillSlug,
  accessState,
}: {
  skillSlug: string;
  accessState: TrainingAccessState;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [resolvedAccess, setResolvedAccess] = useState(accessState);
  useEffect(() => {
    let active = true;
    getTrainingNavigationSkill(skillSlug)
      .then((value) => {
        if (active) setResolvedAccess(value.accessState);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [skillSlug]);
  if (resolvedAccess === "locked")
    return (
      <div>
        <Link
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-violet-300 bg-violet-50 px-4 text-sm font-bold text-violet-700"
          href="/planes"
        >
          <LockKeyhole aria-hidden="true" size={16} />
          Ver planes
        </Link>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Tu acceso se verifica nuevamente al iniciar.
        </p>
      </div>
    );
  if (resolvedAccess === "coming_soon")
    return (
      <p className="rounded-[8px] bg-slate-100 p-4 text-sm font-semibold text-slate-600">
        Los ejercicios de esta habilidad estarán disponibles próximamente.
      </p>
    );
  async function start() {
    setLoading(true);
    setNotice("");
    try {
      const recommendation = await getAdaptiveRecommendation(7, skillSlug);
      const session = await acceptAdaptiveRecommendation(recommendation.id);
      await trackTrainingNavigationEvent("training_skill_started", {
        skill: skillSlug,
        source: "skill_page",
      }).catch(() => undefined);
      router.push(`/ejercicios/${session.sessionId}`);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "No pudimos preparar este entrenamiento.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <div>
      <button
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-violet-700 px-4 text-sm font-bold text-white hover:bg-violet-800 disabled:cursor-wait disabled:bg-slate-300"
        disabled={loading}
        onClick={() => void start()}
        type="button"
      >
        {loading ? (
          <Loader2
            aria-hidden="true"
            className="animate-spin motion-reduce:animate-none"
            size={16}
          />
        ) : null}
        {loading ? "Preparando..." : "Entrenar esta habilidad"}
        <ArrowRight aria-hidden="true" size={16} />
      </button>
      <p
        aria-live="polite"
        className="mt-3 text-xs font-semibold text-rose-700"
      >
        {notice}
      </p>
    </div>
  );
}
