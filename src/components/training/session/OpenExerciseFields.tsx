"use client";

import type {
  DecisionJustificationExercise,
  ExerciseAnswer,
  GuidedBuilderExercise,
  OpenResponseExercise,
  VisualAnnotationExercise,
} from "@/types/training-engine";

type Props = {
  exercise:
    | OpenResponseExercise
    | GuidedBuilderExercise
    | DecisionJustificationExercise
    | VisualAnnotationExercise;
  answer: ExerciseAnswer | null;
  disabled: boolean;
  onChange: (answer: ExerciseAnswer) => void;
};
const fieldClass =
  "min-h-28 w-full resize-y rounded-[8px] border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-50";
function Counter({ value, maximum }: { value: string; maximum: number }) {
  return (
    <span className="text-xs text-slate-500" aria-live="polite">
      {value.length} / {maximum}
    </span>
  );
}

export function OpenExerciseFields({
  exercise,
  answer,
  disabled,
  onChange,
}: Props) {
  if (exercise.type === "guided_builder") {
    const values = answer?.type === "guided_builder" ? answer.fields : {};
    return (
      <div className="grid gap-5 sm:grid-cols-2">
        {exercise.fields.map((field) => (
          <label className="grid gap-2 text-sm font-bold" key={field.id}>
            {field.label}
            <span className="font-normal text-slate-500">{field.prompt}</span>
            <textarea
              className={fieldClass}
              disabled={disabled}
              maxLength={exercise.maximumLength}
              value={values[field.id] ?? ""}
              onChange={(event) =>
                onChange({
                  type: "guided_builder",
                  fields: { ...values, [field.id]: event.target.value },
                })
              }
            />
          </label>
        ))}
      </div>
    );
  }
  if (exercise.type === "decision_justification") {
    const current =
      answer?.type === "decision_justification"
        ? answer
        : {
            type: "decision_justification" as const,
            optionId: "",
            justification: "",
          };
    return (
      <div className="grid gap-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {exercise.options.map((option) => (
            <button
              aria-pressed={current.optionId === option.id}
              className={`min-h-12 rounded-[8px] border px-4 text-left text-sm font-bold ${current.optionId === option.id ? "border-violet-500 bg-violet-50 text-violet-900" : "border-slate-200 bg-white"}`}
              disabled={disabled}
              key={option.id}
              onClick={() => onChange({ ...current, optionId: option.id })}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        <label className="grid gap-2 text-sm font-bold">
          Explica tu decisión
          <textarea
            className={fieldClass}
            disabled={disabled}
            maxLength={exercise.maximumLength}
            placeholder="Consideré esta opción porque..."
            value={current.justification}
            onChange={(event) =>
              onChange({ ...current, justification: event.target.value })
            }
          />
        </label>
        <Counter
          maximum={exercise.maximumLength}
          value={current.justification}
        />
      </div>
    );
  }
  const text = answer?.type === exercise.type ? answer.text : "";
  return (
    <div>
      <textarea
        aria-describedby={`${exercise.id}-privacy`}
        className={fieldClass}
        disabled={disabled}
        maxLength={exercise.maximumLength}
        minLength={exercise.minimumLength}
        placeholder={exercise.placeholder}
        rows={7}
        value={text}
        onChange={(event) =>
          onChange({ type: exercise.type, text: event.target.value })
        }
      />
      <div className="mt-2 flex justify-between gap-4">
        <p className="text-xs text-slate-500" id={`${exercise.id}-privacy`}>
          {exercise.type === "reflection"
            ? "Evita incluir información personal sensible."
            : `Escribe al menos ${exercise.minimumLength} caracteres.`}
        </p>
        <Counter maximum={exercise.maximumLength} value={text} />
      </div>
    </div>
  );
}
