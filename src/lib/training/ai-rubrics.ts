import {
  trainingRubricSchema,
  type TrainingRubric,
} from "@/lib/training/ai-schemas";

export function parseTrainingRubric(value: unknown): TrainingRubric {
  return trainingRubricSchema.parse(value);
}

export function validateEvaluationCriteria(
  rubric: TrainingRubric,
  ids: string[],
) {
  const expected = new Set(rubric.criteria.map((criterion) => criterion.id));
  return ids.length === expected.size && ids.every((id) => expected.has(id));
}
