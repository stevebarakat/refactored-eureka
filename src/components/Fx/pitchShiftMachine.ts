import { createActorContext } from "@xstate/react";
import { PitchShift } from "tone";
import { assign, assertEvent, setup } from "xstate";

export const pitchShiftMachine = setup({
  types: {
    context: {} as {
      pitchData: { mix: number; pitch: number };
    },
    events: {} as
      | { type: "READ" }
      | { type: "WRITE" }
      | { type: "TURN_OFF" }
      | { type: "CHANGE_MIX"; mix: number; pitchShift: PitchShift }
      | {
          type: "CHANGE_PITCH";
          pitch: number;
          pitchShift: PitchShift;
        },
  },
  actions: {
    setMix: assign(({ context, event }) => {
      assertEvent(event, "CHANGE_MIX");
      const mix = event.mix;
      event.pitchShift.wet.value = mix;
      return {
        pitchData: {
          ...context.pitchData,
          mix,
        },
      };
    }),
    setPitch: assign(({ context, event }) => {
      assertEvent(event, "CHANGE_PITCH");
      const pitch = event.pitch;
      event.pitchShift.pitch = pitch;
      return {
        pitchData: {
          ...context.pitchData,
          pitch,
        },
      };
    }),
  },
  actors: {},
}).createMachine({
  context: {
    pitchData: {
      mix: 0.5,
      pitch: 0,
    },
  },
  id: "pitchShiftMachine",
  initial: "off",
  on: {
    CHANGE_MIX: {
      actions: {
        type: "setMix",
      },
    },
    CHANGE_PITCH: {
      actions: {
        type: "setPitch",
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

export const PitchContext = createActorContext(pitchShiftMachine);
