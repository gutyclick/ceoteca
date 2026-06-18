"use client";

import { useState } from "react";

import { Card } from "@/components/ui/Card";
import type { BookActivity } from "@/types";

type InteractiveExerciseProps = {
  activity: BookActivity;
};

export function InteractiveExercise({ activity }: InteractiveExerciseProps) {
  const [checked, setChecked] = useState<string[]>([]);

  function toggleOption(option: string) {
    setChecked((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option],
    );
  }

  return (
    <Card className="p-6">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand-purple">
        {activity.type}
      </p>
      <h3 className="mt-3 text-xl font-semibold">{activity.title}</h3>
      <p className="mt-3 text-sm leading-7 text-text-secondary">
        {activity.prompt}
      </p>
      {activity.options ? (
        <div className="mt-5 grid gap-2">
          {activity.options.map((option) => (
            <label
              className="flex min-h-11 items-center gap-3 rounded-button border border-white/10 bg-white/[0.035] px-4 text-sm text-text-secondary"
              key={option}
            >
              <input
                checked={checked.includes(option)}
                onChange={() => toggleOption(option)}
                type="checkbox"
              />
              {option}
            </label>
          ))}
        </div>
      ) : (
        <textarea
          className="mt-5 min-h-28 w-full rounded-button border border-white/10 bg-white/[0.035] p-4 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-brand-purple"
          placeholder="Escribe una respuesta breve en modo demo..."
        />
      )}
    </Card>
  );
}
