import { setup } from "xstate";

export const automationMachine = setup({
  types: {
    context: {} as {},
    events: {} as { type: "READ" } | { type: "WRITE" } | { type: "TURN_OFF" },
  },
  schemas: {
    events: {
      READ: {
        type: "object",
        properties: {},
      },
      WRITE: {
        type: "object",
        properties: {},
      },
      TURN_OFF: {
        type: "object",
        properties: {},
      },
    },
  },
}).createMachine({
  context: {},
  id: "Automation",
  initial: "off",
  states: {
    off: {
      on: {
        READ: {
          target: "reading",
        },
        WRITE: {
          target: "writing",
        },
      },
    },
    reading: {
      on: {
        WRITE: {
          target: "writing",
        },
        TURN_OFF: {
          target: "off",
        },
      },
    },
    writing: {
      on: {
        TURN_OFF: {
          target: "off",
        },
        READ: {
          target: "reading",
        },
      },
    },
  },
});
