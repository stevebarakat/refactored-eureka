import { useActorRef, useSelector } from "@xstate/react";
import { useCallback } from "react";
import { createMachine } from "xstate";

const toggleMachine = createMachine({
  initial: "inactive",
  states: {
    inactive: {
      on: {
        TOGGLE: {
          target: "active",
        },
      },
    },
    active: {
      on: {
        TOGGLE: {
          target: "inactive",
        },
      },
    },
  },
});

export const useToggleMachine = () => {
  const toggleActor = useActorRef(toggleMachine);
  const isActive = useSelector(toggleActor, (s) => s.matches("active"));

  console.log("isActive", isActive);

  const toggle = useCallback(
    () => toggleActor.send({ type: "TOGGLE" }),
    [toggleActor]
  );

  return [isActive, toggle];
};
