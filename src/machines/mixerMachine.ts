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
    /** @xstate-layout N4IgpgJg5mDOIC5QFsCWAPMAnAsgQwGMALVAOzADoAjAV1QBsIyoBiCAe3IrIDd2BrSrQYRsAbQAMAXUSgADu1ioALqk6yQ6RAEYAbABYArBQAcAJjOGJATgm7L1s-oA0IAJ6IDZihZMnt1tr+AMzaAOyGAL6RrmiYuIQkXMKMzCzYWOxYFHL0eMoAZlnI1HSM4tIaCkqq6kiaOrrB3s2WNnYOTq4eCIba3hIR+kHtEiZRMSBx2PjEZJRYYHgQbhTKWIT8s0mUAMrs9OzcpISqPGAsACoA8gDitwAyAKKSMvXVKmqkGloIegGmXQ2fTWMIgszBFzuHTNYIUYLWXS2My6PRhCK6aKxDAzRLzCiLZardabbb4-aHCinVDnK53R4vSrvRSfOqgX7afTowHA0HgyHdGEQ+GI5Go3TowyYybTBJzLiElZrDYELZ4rg4GjKShkam0m73Z6vKos2rfeoc6zWEw86wgsGOAXQv6hOEIpESFFojFYqY4uU7AlLJUk1VkjVayh6i4GhnG5k1L4-HTjXS2+38qE9bSukUer0Sn0y-3hhbB4kqtXyi4AYQAEgBBABytyeAH0AGrXB4AVRwjLe8lNSYtiAswTCFEMJhsM7MtlBlkFf0G+gonsMwyRhmC-n0wV9stLQaJytJ6ouPYACgARBuXdsAMQAGm2mw3+7t40PE2yGghx2sKcZ2tT0FzCJdnRzMxJw3LdrB3PcD2LeJj0VCtz2rFh62bVs2yvZtvxAD4zWTACnEnadZzAmwIMMZdtACNM4L0BDd05ZDsVQi8TxWFgACUnl2J5LiIkiR3ZRATAMChdDkpxIQkfQmmXaxgjhewJAkTdgj6MI7AmLjcWrXi3BYYSngAaTE4c-w5Lk0xMLkJHCMZDGnMEGN0HdZIcCd-BsQxEUPEsePQ7DGxbdsu17fsbN-c1JL+MJOVMZzXPGDys0aHz7CC-ztEC4KUOMwNSHYZR+PLcynmeGtLjbXZrhbeLWUS-9FwoNTbGUpwuUCXRlx3OEwl0sJxjtWwJpC7iTPQs9SFgBQsGUY9YGUdg5DkSAWAInthNa0jRwQExAlkqw-B3KUIkYhi0QoIJXWnAIzBMMJpSMgN8XmklFuW1aePWvAVp23ZLgbfjRKZH82rI064W0C7xl0iU+jMBjdO8AbXve+Txn0aJJnK0R4HqI8LxNBKyLktcbG8wYnKBK1rGXSwBiGEZbDcmbSvxcrKvLSnYeO8a1xuly7BBByWeddztAoCCprMMC9EGHmvq4DIsiFo6kqCM6KNCQLRqUkwhshB62IhQqLH0Jz1ePFImFIKAdYk-9+hBeEbuGMZPX07LegsS2d2tz0nHtkqNbLIk3bsxAUoGRErFFpmrWXFKbU07T9z0gyHbC8szzDCmE2FvX2PTPlHUDm213dMVvSlAu5qL0Mq0DCl2Dj9r7PnKuHQhWuczdUVPXFSUPr9WbAx+ytjy745ox7sjOTtAfMwY6280bwtm6jtC2-nnjF+XsvdY9kEbWk3lB6dbNhlH-MJ6LT7D9Pdvj01bUV+OkZr6ZhmGud1hQN3Hk3Ke5NW4f2PiZb+OoTgEDOGAX+es3pwhvpNO+tcLDyzAQWSeLdZ5H0woGeBVIkE0hQefd2HI3qTkwUAoeDF9ASCfrvQhB9C4wLwH9LIANqyoP-O9CQ65k4M2UjYdOUE7BAUejmZ6jg3qQNCtAkMGw+ErTWhtLakAhG-BnDaOmKdGZSJltmGC3gr5BEUXbRGRDvokM0QIwMQMQYQH0ToP2CtDDKyctJSEQIzZQScKImcSkOgBBzGMQmkQgA */
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
              CHANGE_PAN: {
                target: undefined,
                actions: "setPan",
              },
            },
          },

          transportMachine: {
            on: {
              RESET: {
                // guard: "canStop?",
                target: "transportMachine",

                actions: {
                  type: "reset",
                },
              },
              SEEK: {
                // guard: "canSeek?",

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
                    // guard: "canPlay?",
                    actions: "play",
                  },
                },
              },
              started: {
                on: {
                  PAUSE: {
                    target: "stopped",
                    // guard: "canStop?",
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
        t.seconds = 0;
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
    guards: {
      "canSeek?": ({ event }) => {
        assertEvent(event, "SEEK");
        return event.direction === "backward" ? t.seconds > event.amount : true;
      },
      // "canStop?": () => t.seconds !== 0,
      // "canPlay?": () => !(t.state === "started"),
    },
  }
);

export const MixerContext = createActorContext(mixerMachine);
