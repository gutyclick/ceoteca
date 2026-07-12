import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { trainingSessions } from "@/data/training-sessions";
import { ExerciseRenderer } from "@/components/training/session/ExerciseRenderer";

const exercises = trainingSessions[0].exercises;
const renderExercise = (index: number) => {
  const onChange = vi.fn();
  const onHint = vi.fn();
  render(
    <ExerciseRenderer
      currentAnswer={null}
      disabled={false}
      exercise={exercises[index]}
      feedbackState={null}
      onAnswerChange={onChange}
      onRequestHint={onHint}
    />,
  );
  return { onChange, onHint };
};
describe("ExerciseRenderer", () => {
  it.each([0, 1, 2, 3, 4, 5])("renderiza el tipo del ejercicio %s", (index) => {
    renderExercise(index);
    expect(screen.getByText(exercises[index].prompt)).toBeInTheDocument();
  });
  it("conserva selección y bloquea cambios", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const exercise = exercises[0];
    const { rerender } = render(
      <ExerciseRenderer
        currentAnswer={null}
        disabled={false}
        exercise={exercise}
        feedbackState={null}
        onAnswerChange={onChange}
        onRequestHint={vi.fn()}
      />,
    );
    await user.click(screen.getAllByRole("radio")[0]);
    expect(onChange).toHaveBeenCalled();
    rerender(
      <ExerciseRenderer
        currentAnswer={{ type: "single_choice", optionId: "a" }}
        disabled
        exercise={exercise}
        feedbackState={{ kind: "incorrect", explanation: "x", principle: "y" }}
        onAnswerChange={onChange}
        onRequestHint={vi.fn()}
      />,
    );
    expect(screen.getAllByRole("radio")[0]).toBeDisabled();
  });
  it("solicita una pista", async () => {
    const user = userEvent.setup();
    const { onHint } = renderExercise(0);
    await user.click(screen.getByRole("button", { name: "Ver pista" }));
    expect(onHint).toHaveBeenCalledOnce();
  });
});
