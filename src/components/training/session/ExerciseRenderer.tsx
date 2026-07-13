"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronsDown,
  ChevronsUp,
  Eye,
  Lightbulb,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { OpenExerciseFields } from "@/components/training/session/OpenExerciseFields";
import type {
  Exercise,
  ExerciseAnswer,
  FeedbackState,
  FlashcardRating,
} from "@/types/training-engine";

type Props = {
  exercise: Exercise;
  currentAnswer: ExerciseAnswer | null;
  disabled: boolean;
  feedbackState: FeedbackState;
  onAnswerChange: (answer: ExerciseAnswer) => void;
  onRequestHint: () => void;
};
const optionClass = (selected: boolean, disabled: boolean) =>
  cn(
    "flex min-h-14 w-full items-center gap-3 rounded-[8px] border px-4 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600",
    selected
      ? "border-violet-500 bg-violet-50 text-violet-950"
      : "border-slate-200 bg-white text-slate-700 hover:border-violet-300",
    disabled && "cursor-default opacity-80",
  );

function ChoiceList({
  exercise,
  answer,
  disabled,
  multiple,
  onChange,
}: {
  exercise: Extract<
    Exercise,
    { type: "single_choice" | "multiple_choice" | "scenario" }
  >;
  answer: ExerciseAnswer | null;
  disabled: boolean;
  multiple: boolean;
  onChange: Props["onAnswerChange"];
}) {
  const selected =
    answer?.type === "multiple_choice"
      ? answer.optionIds
      : answer && "optionId" in answer
        ? [answer.optionId]
        : [];
  return (
    <div className="grid gap-3" role={multiple ? "group" : "radiogroup"}>
      {exercise.options.map((option, index) => {
        const active = selected.includes(option.id);
        return (
          <button
            aria-checked={active}
            className={optionClass(active, disabled)}
            disabled={disabled}
            key={option.id}
            onClick={() => {
              if (multiple) {
                const values = active
                  ? selected.filter((id) => id !== option.id)
                  : [...selected, option.id];
                onChange({ type: "multiple_choice", optionIds: values });
              } else
                onChange({
                  type: exercise.type,
                  optionId: option.id,
                } as ExerciseAnswer);
            }}
            role={multiple ? "checkbox" : "radio"}
            type="button"
          >
            <span
              className={cn(
                "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-black",
                active
                  ? "border-violet-600 bg-violet-600 text-white"
                  : "border-slate-300",
              )}
            >
              {active ? <Check size={15} /> : String.fromCharCode(65 + index)}
            </span>
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Ordering({
  exercise,
  answer,
  disabled,
  onChange,
}: {
  exercise: Extract<Exercise, { type: "ordering" }>;
  answer: ExerciseAnswer | null;
  disabled: boolean;
  onChange: Props["onAnswerChange"];
}) {
  const order =
    answer?.type === "ordering"
      ? answer.itemIds
      : exercise.items.map((item) => item.id);
  const move = (index: number, target: number) => {
    const next = [...order];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange({ type: "ordering", itemIds: next });
  };
  return (
    <ol className="grid gap-3">
      {order.map((id, index) => {
        const item = exercise.items.find((candidate) => candidate.id === id);
        if (!item) return null;
        return (
          <li
            className="flex min-h-16 items-center gap-3 rounded-[8px] border border-slate-200 bg-white p-3"
            key={id}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-50 text-sm font-black text-violet-700">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 text-sm font-semibold">
              {item.label}
            </span>
            <div className="flex gap-1">
              <button
                aria-label={`Mover ${item.label} al inicio`}
                className="grid h-10 w-10 place-items-center rounded-[8px] hover:bg-slate-100"
                disabled={disabled || index === 0}
                onClick={() => move(index, 0)}
                type="button"
              >
                <ChevronsUp size={17} />
              </button>
              <button
                aria-label={`Subir ${item.label}`}
                className="grid h-10 w-10 place-items-center rounded-[8px] hover:bg-slate-100"
                disabled={disabled || index === 0}
                onClick={() => move(index, index - 1)}
                type="button"
              >
                <ArrowUp size={17} />
              </button>
              <button
                aria-label={`Bajar ${item.label}`}
                className="grid h-10 w-10 place-items-center rounded-[8px] hover:bg-slate-100"
                disabled={disabled || index === order.length - 1}
                onClick={() => move(index, index + 1)}
                type="button"
              >
                <ArrowDown size={17} />
              </button>
              <button
                aria-label={`Mover ${item.label} al final`}
                className="grid h-10 w-10 place-items-center rounded-[8px] hover:bg-slate-100"
                disabled={disabled || index === order.length - 1}
                onClick={() => move(index, order.length - 1)}
                type="button"
              >
                <ChevronsDown size={17} />
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Flashcard({
  exercise,
  answer,
  disabled,
  onChange,
}: {
  exercise: Extract<Exercise, { type: "flashcard" }>;
  answer: ExerciseAnswer | null;
  disabled: boolean;
  onChange: Props["onAnswerChange"];
}) {
  const [revealed, setRevealed] = useState(false);
  const ratings: Array<{ id: FlashcardRating; label: string }> = [
    { id: "forgot", label: "No lo recordaba" },
    { id: "almost", label: "Casi" },
    { id: "knew", label: "Lo sabía" },
  ];
  return (
    <div>
      <div className="grid min-h-64 place-items-center rounded-[8px] border border-violet-200 bg-violet-50/50 p-7 text-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-700">
            {revealed ? "Respuesta" : "Pregunta"}
          </p>
          <p className="mt-4 text-xl font-black leading-8">
            {revealed ? exercise.back : exercise.front}
          </p>
        </div>
      </div>
      {!revealed ? (
        <button
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[8px] border border-violet-300 font-bold text-violet-700"
          onClick={() => setRevealed(true)}
          type="button"
        >
          <Eye size={18} />
          Mostrar respuesta
        </button>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {ratings.map((rating) => (
            <button
              className={optionClass(
                answer?.type === "flashcard" && answer.rating === rating.id,
                disabled,
              )}
              disabled={disabled}
              key={rating.id}
              onClick={() => onChange({ type: "flashcard", rating: rating.id })}
              type="button"
            >
              {rating.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ExerciseRenderer({
  exercise,
  currentAnswer,
  disabled,
  feedbackState,
  onAnswerChange,
  onRequestHint,
}: Props) {
  let content: React.ReactNode;
  switch (exercise.type) {
    case "single_choice":
      content = (
        <ChoiceList
          answer={currentAnswer}
          disabled={disabled}
          exercise={exercise}
          multiple={false}
          onChange={onAnswerChange}
        />
      );
      break;
    case "multiple_choice":
      content = (
        <>
          <p className="mb-3 text-sm text-slate-500">
            Selecciona{" "}
            {exercise.selectionCount ?? exercise.correctOptionIds.length}{" "}
            respuestas.
          </p>
          <ChoiceList
            answer={currentAnswer}
            disabled={disabled}
            exercise={exercise}
            multiple
            onChange={onAnswerChange}
          />
        </>
      );
      break;
    case "true_false":
      content = (
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { value: true, label: "Verdadero" },
            { value: false, label: "Falso" },
          ].map((option) => (
            <button
              aria-pressed={
                currentAnswer?.type === "true_false" &&
                currentAnswer.value === option.value
              }
              className={optionClass(
                currentAnswer?.type === "true_false" &&
                  currentAnswer.value === option.value,
                disabled,
              )}
              disabled={disabled}
              key={option.label}
              onClick={() =>
                onAnswerChange({ type: "true_false", value: option.value })
              }
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      );
      break;
    case "ordering":
      content = (
        <Ordering
          answer={currentAnswer}
          disabled={disabled}
          exercise={exercise}
          onChange={onAnswerChange}
        />
      );
      break;
    case "flashcard":
      content = (
        <Flashcard
          answer={currentAnswer}
          disabled={disabled}
          exercise={exercise}
          onChange={onAnswerChange}
        />
      );
      break;
    case "scenario":
      content = (
        <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-5">
          <p className="mb-5 text-base leading-7 text-slate-700">
            {exercise.context}
          </p>
          <ChoiceList
            answer={currentAnswer}
            disabled={disabled}
            exercise={exercise}
            multiple={false}
            onChange={onAnswerChange}
          />
        </div>
      );
      break;
    case "open_response":
    case "guided_builder":
    case "decision_justification":
    case "reflection":
      content = (
        <OpenExerciseFields
          answer={currentAnswer}
          disabled={disabled}
          exercise={exercise}
          onChange={onAnswerChange}
        />
      );
      break;
    default:
      content = (
        <p role="alert">Este tipo de ejercicio todavía no está disponible.</p>
      );
  }
  return (
    <section className="min-w-0">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-700">
        {exercise.skill}
      </p>
      <h1 className="mt-3 text-2xl font-black tracking-[-0.03em] sm:text-3xl">
        {exercise.prompt}
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        {exercise.instruction}
      </p>
      <div className="mt-7">{content}</div>
      {exercise.hint && !feedbackState ? (
        <button
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-[8px] px-3 text-sm font-bold text-slate-600 hover:bg-slate-100"
          disabled={disabled}
          onClick={onRequestHint}
          type="button"
        >
          <Lightbulb size={17} />
          Ver pista
        </button>
      ) : null}
    </section>
  );
}
