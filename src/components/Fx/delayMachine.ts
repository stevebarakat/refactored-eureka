import { createActorContext } from "@xstate/react";
import { FeedbackDelay } from "tone";
import { assign, assertEvent, setup } from "xstate";

export const delayMachine = setup({
  types: {
    context: {} as {
      delayData: { mix: number; delayTime: number; feedback: number };
    },
    events: {} as
      | { type: "READ" }
      | { type: "WRITE" }
      | { type: "TURN_OFF" }
      | {
          type: "CHANGE_FEEDBACK";
          feedback: number;
          delay: FeedbackDelay;
        }
      | { type: "CHANGE_TIME"; delayTime: number; delay: FeedbackDelay }
      | { type: "CHANGE_MIX"; mix: number; delay: FeedbackDelay },
  },
  actions: {
    setMix: assign(({ context, event }) => {
      assertEvent(event, "CHANGE_MIX");
      const mix = event.mix;
      event.delay.wet.value = mix;
      return {
        delayData: {
          ...context.delayData,
          mix,
        },
      };
    }),
    setDelayTime: assign(({ context, event }) => {
      assertEvent(event, "CHANGE_TIME");
      const delayTime = event.delayTime;
      event.delay.delayTime.value = delayTime;
      return {
        delayData: {
          ...context.delayData,
          delayTime,
        },
      };
    }),
    setFeedback: assign(({ context, event }) => {
      assertEvent(event, "CHANGE_FEEDBACK");
      const feedback = event.feedback;
      event.delay.feedback.value = feedback;
      return {
        delayData: {
          ...context.delayData,
          feedback,
        },
      };
    }),
  },
  actors: {},
}).createMachine({
  context: {
    delayData: {
      mix: 0.5,
      feedback: 0,
      delayTime: 0.5,
    },
  },
  id: "delayMachine",
  initial: "off",
  on: {
    CHANGE_MIX: {
      actions: {
        type: "setMix",
      },
    },
    CHANGE_TIME: {
      actions: {
        type: "setDelayTime",
      },
    },
    CHANGE_FEEDBACK: {
      actions: {
        type: "setFeedback",
      },
    },
  },
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
        READ: {
          target: "reading",
        },
        TURN_OFF: {
          target: "off",
        },
      },
    },
  },
});

export const DelayContext = createActorContext(delayMachine);
