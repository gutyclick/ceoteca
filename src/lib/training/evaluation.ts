import type {
  Exercise,
  ExerciseAnswer,
  FlashcardRating,
} from "@/types/training-engine";

const sameSet = (left: string[], right: string[]) =>
  left.length === right.length && left.every((item) => right.includes(item));
export function isAnswerComplete(answer: ExerciseAnswer | null) {
  if (!answer) return false;
  if (answer.type === "multiple_choice") return answer.optionIds.length > 0;
  if (answer.type === "ordering") return answer.itemIds.length > 0;
  if (answer.type === "open_response" || answer.type === "reflection")
    return answer.text.trim().length > 0;
  if (answer.type === "guided_builder")
    return (
      Object.values(answer.fields).length > 0 &&
      Object.values(answer.fields).every((value) => value.trim().length > 0)
    );
  if (answer.type === "decision_justification")
    return Boolean(answer.optionId && answer.justification.trim());
  return true;
}

export function evaluateAnswer(
  exercise: Exercise,
  answer: ExerciseAnswer,
): boolean {
  if (exercise.type !== answer.type) return false;
  switch (exercise.type) {
    case "single_choice":
      return (
        answer.type === "single_choice" &&
        answer.optionId === exercise.correctOptionId
      );
    case "multiple_choice":
      return (
        answer.type === "multiple_choice" &&
        sameSet(answer.optionIds, exercise.correctOptionIds)
      );
    case "true_false":
      return (
        answer.type === "true_false" && answer.value === exercise.correctValue
      );
    case "ordering":
      return (
        answer.type === "ordering" &&
        exercise.correctOrder.every((id, index) => answer.itemIds[index] === id)
      );
    case "flashcard":
      return answer.type === "flashcard" && answer.rating === "knew";
    case "scenario":
      return (
        answer.type === "scenario" &&
        answer.optionId === exercise.correctOptionId
      );
    case "open_response":
    case "guided_builder":
    case "decision_justification":
    case "reflection":
      return false;
  }
}

export const scoreRules = {
  firstAttempt: 100,
  retry: 70,
  hint: 80,
  incorrect: 0,
  flashcard: { knew: 100, almost: 60, forgot: 20 } satisfies Record<
    FlashcardRating,
    number
  >,
};
export function scoreAnswer(
  answer: ExerciseAnswer,
  correct: boolean,
  attempts: number,
  hintUsed: boolean,
) {
  if (answer.type === "flashcard") return scoreRules.flashcard[answer.rating];
  if (!correct) return scoreRules.incorrect;
  if (attempts > 1) return scoreRules.retry;
  if (hintUsed) return scoreRules.hint;
  return scoreRules.firstAttempt;
}
