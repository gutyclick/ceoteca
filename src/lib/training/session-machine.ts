import { assign, setup } from "xstate";

type Context = { hasAnswer: boolean; exerciseIndex: number; totalExercises: number; midpointEnabled: boolean; midpointSeen: boolean; error?: string };
type Event = { type: "SESSION_LOADED"; restoredIndex?: number } | { type: "START_SESSION" } | { type: "ANSWER_CHANGED"; hasAnswer: boolean } | { type: "SUBMIT_ANSWER" } | { type: "ANSWER_CORRECT" } | { type: "ANSWER_INCORRECT" } | { type: "RETRY" } | { type: "CONTINUE" } | { type: "NEXT_EXERCISE" } | { type: "CONTINUE_MIDPOINT" } | { type: "COMPLETE_SESSION" } | { type: "FAIL"; message: string } | { type: "RETRY_LOADING" };

export const createTrainingSessionMachine = (totalExercises: number, midpointEnabled = true) => setup({
  types: { context: {} as Context, events: {} as Event },
  guards: { hasAnswer: ({ context }) => context.hasAnswer, shouldShowMidpoint: ({ context }) => context.midpointEnabled && !context.midpointSeen && context.totalExercises >= 6 && context.exerciseIndex + 1 === Math.ceil(context.totalExercises / 2), isLast: ({ context }) => context.exerciseIndex >= context.totalExercises - 1 },
  actions: {
    setAnswer: assign({ hasAnswer: ({ event }) => event.type === "ANSWER_CHANGED" ? event.hasAnswer : false }),
    restore: assign({ exerciseIndex: ({ event }) => event.type === "SESSION_LOADED" ? event.restoredIndex ?? 0 : 0 }),
    advance: assign({ exerciseIndex: ({ context }) => context.exerciseIndex + 1, hasAnswer: false }),
    markMidpoint: assign({ midpointSeen: true }),
    setError: assign({ error: ({ event }) => event.type === "FAIL" ? event.message : "Error inesperado" }),
  },
}).createMachine({ id: "trainingSession", initial: "loading", context: { hasAnswer: false, exerciseIndex: 0, totalExercises, midpointEnabled, midpointSeen: false }, states: {
  loading: { on: { SESSION_LOADED: { target: "intro", actions: "restore" }, FAIL: { target: "error", actions: "setError" } } },
  intro: { on: { START_SESSION: "answering" } },
  answering: { on: { ANSWER_CHANGED: { actions: "setAnswer" }, SUBMIT_ANSWER: { target: "validating", guard: "hasAnswer" }, FAIL: { target: "error", actions: "setError" } } },
  validating: { on: { ANSWER_CORRECT: "correctFeedback", ANSWER_INCORRECT: "incorrectFeedback", FAIL: { target: "error", actions: "setError" } } },
  correctFeedback: { on: { CONTINUE: [{ target: "results", guard: "isLast" }, { target: "midpoint", guard: "shouldShowMidpoint", actions: "markMidpoint" }, { target: "nextExercise" }] } },
  incorrectFeedback: { on: { RETRY: "retrying", CONTINUE: [{ target: "results", guard: "isLast" }, { target: "midpoint", guard: "shouldShowMidpoint", actions: "markMidpoint" }, { target: "nextExercise" }] } },
  retrying: { entry: assign({ hasAnswer: false }), always: "answering" },
  midpoint: { on: { CONTINUE_MIDPOINT: "nextExercise" } },
  nextExercise: { entry: "advance", always: "answering" },
  results: { type: "final" },
  error: { on: { RETRY_LOADING: "loading" } },
} });
