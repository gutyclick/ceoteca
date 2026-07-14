import { assign, setup } from "xstate";

export const roleplayMachine = setup({
  types: {
    context: {} as { error: string },
    events: {} as
      | { type: "LOADED" }
      | { type: "SEND" }
      | { type: "REPLIED" }
      | { type: "PAUSE" }
      | { type: "PAUSED" }
      | { type: "RESUME" }
      | { type: "RESUMED" }
      | { type: "FINISH" }
      | { type: "EVALUATING" }
      | { type: "FAIL"; error: string }
      | { type: "RETRY" },
  },
}).createMachine({
  id: "roleplay",
  initial: "loading",
  context: { error: "" },
  states: {
    loading: {
      on: {
        LOADED: "ready",
        FAIL: {
          target: "providerFailed",
          actions: assign({ error: ({ event }) => event.error }),
        },
      },
    },
    ready: {
      on: { SEND: "characterThinking", PAUSE: "pausing", FINISH: "finishing" },
    },
    characterThinking: {
      on: {
        REPLIED: "ready",
        FAIL: {
          target: "providerFailed",
          actions: assign({ error: ({ event }) => event.error }),
        },
      },
    },
    pausing: {
      on: {
        PAUSED: "paused",
        FAIL: {
          target: "providerFailed",
          actions: assign({ error: ({ event }) => event.error }),
        },
      },
    },
    paused: { on: { RESUME: "resuming" } },
    resuming: {
      on: {
        RESUMED: "ready",
        FAIL: {
          target: "providerFailed",
          actions: assign({ error: ({ event }) => event.error }),
        },
      },
    },
    finishing: {
      on: {
        EVALUATING: "evaluating",
        FAIL: {
          target: "providerFailed",
          actions: assign({ error: ({ event }) => event.error }),
        },
      },
    },
    evaluating: {},
    providerFailed: { on: { RETRY: "ready" } },
  },
});
