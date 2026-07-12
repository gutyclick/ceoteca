import type { AnswerRecord, TrainingSession, TrainingSessionResult } from "@/types/training-engine";

export function calculateTrainingResult(session: TrainingSession, answers: AnswerRecord[], startedAt: string): TrainingSessionResult {
  const correct = answers.filter((answer) => answer.correct);
  const scores = answers.map((answer) => answer.score);
  const bySkill = session.exercises.map((exercise) => ({ skill: exercise.skill, correct: answers.find((item) => item.exerciseId === exercise.id)?.correct ?? false }));
  const strengths = [...new Set(bySkill.filter((item) => item.correct).map((item) => item.skill))].slice(0, 3);
  const areasToReview = [...new Set(bySkill.filter((item) => !item.correct).map((item) => item.skill))].slice(0, 3);
  const score = scores.length ? Math.round(scores.reduce((total, value) => total + value, 0) / scores.length) : 0;
  return { sessionId: session.id, correctAnswers: correct.length, incorrectAnswers: answers.length - correct.length, retriedAnswers: answers.filter((answer) => answer.attempts > 1).length, hintsUsed: answers.filter((answer) => answer.hintUsed).length, completionPercentage: Math.round((answers.length / session.exercises.length) * 100), score, masteryBefore: session.masteryBefore, masteryAfter: Math.min(100, session.masteryBefore + Math.round(score / 14)), strengths: strengths.length ? strengths : [session.skills[0]], areasToReview: areasToReview.length ? areasToReview : [session.skills.at(-1) ?? session.skills[0]], durationSeconds: Math.max(60, Math.round((Date.now() - new Date(startedAt).getTime()) / 1000)), completedAt: new Date().toISOString() };
}
