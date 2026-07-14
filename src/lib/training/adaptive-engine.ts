import {
  adaptiveWeights,
  durationTargets,
} from "@/lib/training/adaptive-config";
import type {
  AdaptiveCandidate,
  AdaptiveTrainingEngine,
  AdaptiveTrainingInput,
  AdaptiveTrainingRecommendation,
} from "@/lib/training/adaptive-types";
import type { TrainingDifficulty } from "@/types/training-engine";

export function scoreAdaptiveCandidate(
  candidate: AdaptiveCandidate,
  now: string,
) {
  let score = 0;
  if (candidate.dueReview) score += adaptiveWeights.dueReview;
  score += Math.min(candidate.recentErrors, 2) * adaptiveWeights.recentError;
  if (candidate.alignedWithGoal) score += adaptiveWeights.goalAlignment;
  if (candidate.mastery < 40) score += adaptiveWeights.lowMastery;
  else if (candidate.mastery < 70) score += adaptiveWeights.mediumMastery;
  if (candidate.isNew) score += adaptiveWeights.newContent;
  if (candidate.lastPracticedAt) {
    const days =
      (Date.parse(now) - Date.parse(candidate.lastPracticedAt)) / 86_400_000;
    if (days >= 14) score += adaptiveWeights.inactivity;
    if (days < 1) score += adaptiveWeights.practicedToday;
  }
  return score;
}

export function selectDifficulty(
  mastery: number,
  recentErrors = 0,
  hintsUsed = 0,
): TrainingDifficulty {
  if (recentErrors >= 2 || hintsUsed >= 2 || mastery < 30) return "beginner";
  if (mastery >= 80 && recentErrors === 0 && hintsUsed === 0) return "advanced";
  return "intermediate";
}

function selectVaried(candidates: AdaptiveCandidate[], count: number) {
  const selected: AdaptiveCandidate[] = [];
  for (const candidate of candidates) {
    if (!candidate.prerequisiteEligible) continue;
    const lastTwo = selected.slice(-2);
    if (
      lastTwo.length === 2 &&
      lastTwo.every((item) => item.type === candidate.type)
    )
      continue;
    if (
      selected.filter((item) => item.conceptId === candidate.conceptId)
        .length >= 3
    )
      continue;
    if (
      candidate.format &&
      selected.slice(-2).every((item) => item.format === candidate.format)
    )
      continue;
    if (
      candidate.cognitiveLevel === "recognition" &&
      selected.filter((item) => item.cognitiveLevel === "recognition").length >=
        Math.ceil(count / 2)
    )
      continue;
    selected.push(candidate);
    if (selected.length >= count) break;
  }
  return selected;
}

export class RuleBasedAdaptiveTrainingEngine implements AdaptiveTrainingEngine {
  async buildRecommendation(
    input: AdaptiveTrainingInput,
  ): Promise<AdaptiveTrainingRecommendation> {
    const planRank = { free: 0, pro: 1, founder: 1, unlimited: 2 } as const;
    const ranked = input.candidates
      .filter((candidate) => {
        const required = candidate.minimumPlan ?? "free";
        if (planRank[input.plan] < planRank[required]) return false;
        if (
          candidate.format === "conversational-roleplay" &&
          input.plan === "free"
        )
          return false;
        if (
          candidate.format === "visual-analysis" &&
          !candidate.hasApprovedVisualAssets
        )
          return false;
        return candidate.prerequisiteEligible;
      })
      .sort(
        (a, b) =>
          scoreAdaptiveCandidate(b, input.now) -
          scoreAdaptiveCandidate(a, input.now),
      );
    if (!ranked.length) throw new Error("NO_ELIGIBLE_CONTENT");
    const primarySkillId = ranked[0].skillId;
    const target = durationTargets[input.requestedDurationMinutes];
    const ordered = [
      ...ranked.filter((item) => item.dueReview),
      ...ranked.filter(
        (item) => item.skillId === primarySkillId && !item.dueReview,
      ),
      ...ranked.filter(
        (item) => item.skillId !== primarySkillId && !item.dueReview,
      ),
    ];
    const selected = selectVaried(ordered, target);
    const deepTypes = new Set([
      "open_response",
      "guided_builder",
      "decision_justification",
      "reflection",
      "visual_annotation",
      "message_response",
      "message_comparison",
      "tone_adjustment",
      "objection_response",
      "email_rewrite",
      "conversation_diagnosis",
    ]);
    const includesDeepAI =
      input.aiQuotaRemaining > 0 &&
      input.requestedDurationMinutes >= 7 &&
      selected.some((item) => deepTypes.has(item.type));
    const seconds = selected.reduce(
      (sum, item) => sum + item.estimatedSeconds,
      0,
    );
    const mastery =
      ranked
        .filter((item) => item.skillId === primarySkillId)
        .reduce((sum, item) => sum + item.mastery, 0) /
      Math.max(
        1,
        ranked.filter((item) => item.skillId === primarySkillId).length,
      );
    return {
      primarySkillId,
      secondarySkillIds: [
        ...new Set(
          selected
            .map((item) => item.skillId)
            .filter((id) => id !== primarySkillId),
        ),
      ].slice(0, 2),
      exerciseIds: selected.map((item) => item.id),
      difficulty: selectDifficulty(mastery, ranked[0].recentErrors),
      requestedDurationMinutes: input.requestedDurationMinutes,
      calculatedDurationMinutes: Math.max(1, Math.round(seconds / 60)),
      includesDeepAIEvaluation: includesDeepAI,
      explanation: {
        primaryReason: ranked[0].dueReview
          ? "Tienes un repaso pendiente de esta habilidad."
          : ranked[0].recentErrors
            ? "Esta habilidad merece refuerzo por tus intentos recientes."
            : ranked[0].alignedWithGoal
              ? "Esta habilidad está alineada con tu objetivo principal."
              : "Esta práctica equilibra progreso y variedad.",
        supportingReasons: [
          selected.some((item) => item.dueReview)
            ? "Incluye repasos pendientes."
            : "Introduce práctica progresiva.",
          selected.some((item) => item.isNew)
            ? "Incluye contenido nuevo elegible."
            : "Refuerza conceptos ya iniciados.",
        ],
        skills: [...new Set(selected.map((item) => item.skillId))],
        estimatedDuration: Math.max(1, Math.round(seconds / 60)),
        includesReview: selected.some((item) => item.dueReview),
        includesNewContent: selected.some((item) => item.isNew),
        includesDeepAIEvaluation: includesDeepAI,
        category: ranked[0].categoryId,
        concept: ranked[0].conceptId,
        cognitiveLevel: ranked[0].cognitiveLevel,
        format: ranked[0].format,
        path: ranked[0].pathId,
        planEligibility: true,
      },
    };
  }
}
