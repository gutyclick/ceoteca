export type ExerciseType = "single_choice" | "multiple_choice" | "true_false" | "ordering" | "flashcard" | "scenario";
export type TrainingDifficulty = "beginner" | "intermediate" | "advanced";
export type TrainingSessionStatus = "not_started" | "in_progress" | "completed" | "abandoned";
export type FlashcardRating = "forgot" | "almost" | "knew";

export type ExerciseOption = { id: string; label: string };
export type TrainingBookReference = { id: string; title: string; author: string; imagePath: string };
export type BaseExercise = { id: string; type: ExerciseType; title?: string; prompt: string; instruction: string; skill: string; concept: string; difficulty: TrainingDifficulty; estimatedSeconds?: number; hint?: string; explanation: string; sourceBook?: Omit<TrainingBookReference, "imagePath"> };
export type SingleChoiceExercise = BaseExercise & { type: "single_choice"; options: ExerciseOption[]; correctOptionId: string };
export type MultipleChoiceExercise = BaseExercise & { type: "multiple_choice"; options: ExerciseOption[]; correctOptionIds: string[]; selectionCount?: number };
export type TrueFalseExercise = BaseExercise & { type: "true_false"; correctValue: boolean };
export type OrderingExercise = BaseExercise & { type: "ordering"; items: ExerciseOption[]; correctOrder: string[] };
export type FlashcardExercise = BaseExercise & { type: "flashcard"; front: string; back: string };
export type ScenarioExercise = BaseExercise & { type: "scenario"; context: string; options: ExerciseOption[]; correctOptionId: string; consequence: string; principle: string; practicalApplication: string };
export type Exercise = SingleChoiceExercise | MultipleChoiceExercise | TrueFalseExercise | OrderingExercise | FlashcardExercise | ScenarioExercise;

export type SingleChoiceAnswer = { type: "single_choice"; optionId: string };
export type MultipleChoiceAnswer = { type: "multiple_choice"; optionIds: string[] };
export type TrueFalseAnswer = { type: "true_false"; value: boolean };
export type OrderingAnswer = { type: "ordering"; itemIds: string[] };
export type FlashcardAnswer = { type: "flashcard"; rating: FlashcardRating };
export type ScenarioAnswer = { type: "scenario"; optionId: string };
export type ExerciseAnswer = SingleChoiceAnswer | MultipleChoiceAnswer | TrueFalseAnswer | OrderingAnswer | FlashcardAnswer | ScenarioAnswer;

export type TrainingSession = { id: string; title: string; description: string; category: string; difficulty: TrainingDifficulty; estimatedMinutes: number; skills: string[]; sourceBooks: TrainingBookReference[]; exercises: Exercise[]; status: TrainingSessionStatus; midpointEnabled: boolean; masteryBefore: number };
export type AnswerRecord = { exerciseId: string; answer: ExerciseAnswer; correct: boolean; attempts: number; hintUsed: boolean; score: number };
export type TrainingSessionProgress = { sessionId: string; currentExerciseIndex: number; answers: AnswerRecord[]; attempts: Record<string, number>; hintsUsed: string[]; startedAt: string; updatedAt: string; completedAt?: string; status: TrainingSessionStatus; midpointSeen: boolean };
export type TrainingSessionResult = { sessionId: string; correctAnswers: number; incorrectAnswers: number; retriedAnswers: number; hintsUsed: number; completionPercentage: number; score: number; masteryBefore: number; masteryAfter: number; strengths: string[]; areasToReview: string[]; durationSeconds: number; completedAt: string };
export type FeedbackState = { kind: "correct" | "incorrect"; explanation: string; principle: string } | null;

export interface TrainingSessionRepository {
  getSession(sessionId: string): Promise<TrainingSession>;
  getProgress(sessionId: string): Promise<TrainingSessionProgress | null>;
  getResult(sessionId: string): Promise<TrainingSessionResult | null>;
  saveProgress(progress: TrainingSessionProgress): Promise<void>;
  completeSession(result: TrainingSessionResult): Promise<void>;
  clearSession(sessionId: string): Promise<void>;
}
