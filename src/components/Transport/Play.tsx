import { MixerContext } from "@/machines/mixerMachine";
import { TransportButton } from "../Buttons";
import { Play as PlayIcon, Pause as PauseIcon } from "lucide-react";

function Play() {
  const { send } = MixerContext.useActorRef();
  const canPause = MixerContext.useSelector((state) =>
    state.matches({ ready: { transportMachine: "started" } })
  );

  return (
    <TransportButton
      onClick={() =>
        canPause ? send({ type: "PAUSE" }) : send({ type: "START" })
      }
    >
      {canPause ? <PauseIcon /> : <PlayIcon />}
    </TransportButton>
  );
}

export default Play;
