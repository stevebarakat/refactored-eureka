import {
  Transport as t,
  Channel,
  Destination,
  Player,
  start,
  loaded,
} from "tone";
import { assertEvent, assign, createMachine, fromPromise } from "xstate";
import { scale, logarithmically } from "@/utils";
import { clockMachine } from "./clockMachine";
import { createActorContext } from "@xstate/react";
import { trackMachine } from "./trackMachine";

type InitialContext = {
  mainVolume: number;
  currentTime: number;
  sourceSong?: SourceSong | undefined;
  clockMachineRef: any;
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
      clockMachineRef: undefined,
      trackMachineRefs: [],
      players: [],
      channels: [],
    },

    entry: "disposeTracks",

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
        },

        exit: ["reset", "disposeTracks"],
        states: {
          mixerMachine: {
            type: "parallel",

            states: {
              Solo: {
                initial: "inactive",

                states: {
                  inactive: {
                    on: {
                      TOGGLE: {
                        target: "active",
                        actions: "toggleSolo",
                      },
                    },
                  },

                  active: {
                    on: {
                      TOGGLE: "inactive",
                    },
                  },
                },
              },
              Mute: {
                initial: "inactive",

                states: {
                  inactive: {
                    on: {
                      TOGGLE: {
                        target: "active",
                        actions: "toggleMute",
                      },
                    },
                  },

                  active: {
                    on: {
                      TOGGLE: "inactive",
                    },
                  },
                },
              },
            },

            on: {
              CHANGE_VOLUME: {
                target: undefined,
                actions: "setVolume",
              },
              CHANGE_FX: {
                target: undefined,
                actions: "setFx",
              },
              CHANGE_PAN: {
                target: undefined,
                actions: "setPan",
              },
            },
          },

          transportMachine: {
            on: {
              RESET: {
                guard: "canStop?",
                target: "transportMachine",

                actions: {
                  type: "reset",
                },
              },
              SEEK: {
                guard: "canSeek?",

                actions: {
                  type: "seek",
                },
              },
            },
            states: {
              stopped: {
                on: {
                  START: {
                    target: "started",
                    guard: "canPlay?",
                    actions: "play",
                  },
                },
              },
              started: {
                on: {
                  PAUSE: {
                    target: "stopped",
                    guard: "canStop?",
                    actions: "pause",
                  },
                },
              },
            },

            initial: "stopped",
          },
        },

        type: "parallel",
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
        start();

        const clockMachineRef = spawn(clockMachine, {
          id: "clock-machine",
          input: {
            sourceSong: context.sourceSong,
          },
        });
        let trackMachineRefs = [];
        context.sourceSong?.tracks.map((track, i) => {
          context.players[i] = new Player(track.path)
            .sync()
            .start(0, context.sourceSong?.startPosition);
          context.channels[i] = new Channel(
            scale(logarithmically(-32))
          ).toDestination();
          context.players[i]?.connect(context.channels[i]);
          trackMachineRefs = [
            ...trackMachineRefs,
            spawn(trackMachine, {
              id: `track-${i + 1}`,
              input: {
                track: context.sourceSong!.tracks[i],
                channel: context.channels[i],
              },
            }),
          ];
        });
        return {
          trackMachineRefs,
          clockMachineRef,
        };
      }),

      reset: () => t.stop(),
      play: () => t.start(),
      pause: () => t.pause(),
      seek: ({ event }) => {
        assertEvent(event, "SEEK");
        if (event.direction === "forward") {
          t.seconds = t.seconds + 10;
        } else {
          t.seconds = t.seconds - 10;
        }
      },
      setMainVolume: assign(({ event }) => {
        assertEvent(event, "CHANGE_MAIN_VOLUME");
        const scaled = scale(logarithmically(event.volume));
        Destination.volume.value = scaled;
        return { volume: event.volume };
      }),
      disposeTracks: assign(({ context }) => {
        context.players?.forEach((player: Player | undefined, i: number) => {
          player?.dispose();
          context.channels[i]?.dispose();
        });
        return {
          channels: [],
          players: [],
        };
      }),
    },
    actors: {
      builder: fromPromise(async () => await loaded()),
    },
    guards: {
      "canSeek?": ({ context, event }) => {
        assertEvent(event, "SEEK");
        return event.direction === "forward"
          ? t.seconds < context.sourceSong!.endPosition - event.amount
          : t.seconds > event.amount;
      },

      "canStop?": () => t.seconds !== 0,
      "canPlay?": () => !(t.state === "started"),
    },
  }
);

export const MixerContext = createActorContext(mixerMachine);
