import { scale, logarithmically } from "@/utils";
import { createActorContext } from "@xstate/react";
import { produce } from "immer";
import { FeedbackDelay, PitchShift } from "tone";
import { setup, assign, assertEvent } from "xstate";

export const trackMachine = setup({
  types: {
    context: {} as {
      track: SourceTrack;
      channel: Channel | undefined;
      volume: number;
      pan: number;
      fxNames: string[];
      fx: (PitchShift | FeedbackDelay)[];
    },

    events: {} as
      | { type: "CHANGE_VOLUME"; volume: number }
      | { type: "CHANGE_PAN"; pan: number }
      | { type: "TOGGLE_SOLO" }
      | { type: "TOGGLE_MUTE" }
      | { type: "TOGGLE_FX_PANEL" }
      | {
          type: "CHANGE_FX";
          fxName: string;
          fxId: number;
          action: string;
        },
    input: {} as {
      track: SourceTrack;
      channel: Channel | undefined;
    },
  },
  actions: {
    setVolume: assign(({ context, event }) => {
      assertEvent(event, "CHANGE_VOLUME");
      console.log("volume", event.volume);
      const volume = parseFloat(event.volume.toFixed(2));
      const scaled = scale(logarithmically(volume));
      produce(context, (draft) => {
        draft.channel!.volume.value = scaled;
      });
      return { volume };
    }),

    setPan: assign(({ context, event }) => {
      assertEvent(event, "CHANGE_PAN");
      const pan = Number(event.pan.toFixed(2));
      produce(context, (draft) => {
        draft.channel!.pan.value = pan;
      });
      return { pan };
    }),
    setFx: assign(({ context, event }) => {
      assertEvent(event, "CHANGE_FX");

      if (event.action === "add") {
        const spliced = context.fxNames.toSpliced(event.fxId, 1);
        const fxSpliced = context.fx.toSpliced(event.fxId, 1);
        context.fx[event.fxId]?.dispose();

        switch (event.fxName) {
          case "delay":
            return {
              fxNames: [...spliced, event.fxName],
              fx: [...fxSpliced, new FeedbackDelay().toDestination()],
            };

          case "pitchShift":
            return {
              fxNames: [...spliced, event.fxName],
              fx: [...fxSpliced, new PitchShift().toDestination()],
            };

          default:
            return {
              fxNames: context.fxNames,
              fx: context.fx,
            };
        }
      } else {
        context.fx[event.fxId].dispose();
        return {
          fxNames: context.fxNames.toSpliced(event.fxId, 1),
          fx: context.fx.toSpliced(event.fxId, 1),
        };
      }
    }),
    toggleMute: function ({ context }) {
      context.channel!.mute = !context.channel!.mute;
    },
    toggleSolo: function ({ context }) {
      context.channel!.solo = !context.channel!.solo;
    },
  },
}).createMachine({
  context: ({ input }) => ({
    track: input.track,
    channel: input.channel,
    volume: -32,
    pan: 0,
    fx: [],
    fxNames: [],
  }),
  id: "trackMachine",
  type: "parallel",
  on: {
    CHANGE_FX: {
      actions: "setFx",
    },
    CHANGE_PAN: {
      actions: "setPan",
    },
    CHANGE_VOLUME: {
      actions: "setVolume",
    },
  },
  states: {
    solo: {
      initial: "inactive",
      states: {
        inactive: {
          on: {
            TOGGLE_SOLO: {
              target: "active",
              actions: "toggleSolo",
            },
          },
        },
        active: {
          on: {
            TOGGLE_SOLO: {
              target: "inactive",
              actions: "toggleSolo",
            },
          },
        },
      },
    },
    mute: {
      initial: "inactive",
      states: {
        inactive: {
          on: {
            TOGGLE_MUTE: {
              target: "active",
              actions: "toggleMute",
            },
          },
        },
        active: {
          on: {
            TOGGLE_MUTE: {
              target: "inactive",
              actions: "toggleMute",
            },
          },
        },
      },
    },
    fxPanel: {
      initial: "open",
      states: {
        open: {
          on: {
            TOGGLE_FX_PANEL: {
              target: "closed",
            },
          },
        },
        closed: {
          on: {
            TOGGLE_FX_PANEL: {
              target: "open",
            },
          },
        },
      },
    },
  },
});

export const TrackContext = createActorContext(trackMachine);
