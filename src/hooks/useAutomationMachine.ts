import { automationMachine } from "@/machines/automationMachine";
import { useActorRef, useSelector } from "@xstate/react";
import { useCallback } from "react";

export const useAutomationMachine = () => {
  const automationActor = useActorRef(automationMachine);
  const state = useSelector(automationActor, (s) => s.value);

  const select = useCallback(
    () => automationActor.send({ type: state }),
    [automationActor, state]
  );

  return [state, select];
};
