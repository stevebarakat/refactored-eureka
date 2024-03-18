import {
  Transport as t,
  Channel,
  Destination,
  Player,
  start as initializeAudio,
  loaded,
} from "tone";
import {
  assertEvent,
  assign,
  createMachine,
  fromPromise,
  stopChild,
} from "xstate";
import { scale, logarithmically } from "@/utils";
import { createActorContext } from "@xstate/react";
import { trackMachine } from "./trackMachine";

type InitialContext = {
  mainVolume: number;
  currentTime: number;
  sourceSong?: SourceSong | undefined;
  trackMachineRefs: any[];
  players: (Player | undefined)[];
  channels: (Channel | undefined)[];
};

export const mixerMachine = createMachine(
  {
    id: "mixerMachine",
    context: {
      mainVolume: -32,
      currentTime: 0,
      sourceSong: undefined,
      trackMachineRefs: [],
      players: [],
      channels: [],
    },
    on: {
      SELECT_SONG: {
        target: ".building",
        actions: "setSourceSong",
      },
    },
    states: {
      notReady: {},
      error: {
        entry: "disposeTracks",
      },
      building: {
        entry: "buildMixer",
        invoke: {
          src: "builder",
          input: ({ context }) => ({ sourceSong: context.sourceSong }),
          onDone: { target: "ready" },
          onError: {
            target: "error",
            actions: "logError",
          },
          id: "builder",
        },
      },
      ready: {
        on: {
          CHANGE_MAIN_VOLUME: {
            actions: {
              type: "setMainVolume",
            },
          },
          RESET: {
            target: "ready",
            actions: {
              type: "reset",
            },
          },
          SEEK: {
            actions: {
              type: "seek",
            },
          },
        },
        exit: ["reset", "disposeTracks"],
        states: {
          stopped: {
            on: {
              START: {
                target: "started",
                actions: "play",
              },
            },
          },
          started: {
            on: {
              PAUSE: {
                target: "stopped",
                actions: "pause",
              },
            },
          },
        },
        initial: "stopped",
      },
    },

    types: {
      context: {} as InitialContext,
      events: {} as
        | { type: "SELECT_SONG"; song: SourceSong }
        | { type: "START" }
        | { type: "PAUSE" }
        | { type: "RESET" }
        | { type: "TOGGLE"; trackId: number }
        | {
            type: "CHANGE_FX";
            fxName: string;
            fxId: number;
            action: string;
          }
        | { type: "SEEK"; direction: string; amount: number }
        | { type: "CHANGE_MAIN_VOLUME"; volume: number }
        | { type: "CHANGE_PAN"; pan: number; trackId: number }
        | { type: "CHANGE_VOLUME"; volume: number; trackId: number },
    },

    initial: "notReady",
  },
  {
    actions: {
      setSourceSong: assign(({ event }) => {
        assertEvent(event, "SELECT_SONG");
        return { sourceSong: event.song };
      }),

      buildMixer: assign(({ context, spawn }) => {
        initializeAudio();
        const { sourceSong, channels, players } = context;

        return {
          trackMachineRefs: sourceSong?.tracks.map((track, i) => {
            channels[i] = new Channel(scale(logarithmically(-32)));
            players[i] = new Player(track.path)
              .sync()
              .start(0, sourceSong?.startPosition)
              .connect(channels[i]!.toDestination());
            return [
              ...context.trackMachineRefs,
              spawn(trackMachine, {
                id: `track-${i + 1}`,
                input: {
                  track: context.sourceSong!.tracks[i],
                  channel: context.channels[i],
                },
              }),
            ];
          }),
        };
      }),
      reset: () => {
        t.stop();
      },
      play: () => t.start(),
      pause: () => t.pause(),
      seek: ({ event }) => {
        assertEvent(event, "SEEK");
        if (event.direction === "forward") {
          t.seconds = t.seconds + event.amount;
        } else {
          t.seconds = t.seconds - event.amount;
        }
      },
      setMainVolume: assign(({ event }) => {
        assertEvent(event, "CHANGE_MAIN_VOLUME");
        const scaled = scale(logarithmically(event.volume));
        Destination.volume.value = scaled;
        return { mainVolume: event.volume };
      }),
      disposeTracks: assign(({ context }) => {
        context.players?.forEach((player: Player | undefined, i: number) => {
          player?.dispose();
          context.channels[i]?.dispose();
          stopChild(context.trackMachineRefs[i]);
        });
        return {
          channels: [],
          players: [],
          trackMachineRefs: [],
        };
      }),
    },
    actors: {
      builder: fromPromise(async () => await loaded()),
    },
  }
);

export const MixerContext = createActorContext(mixerMachine);
