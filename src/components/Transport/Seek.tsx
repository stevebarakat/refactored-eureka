import { MixerContext } from "@/machines/mixerMachine";
import { Transport as t } from "tone";
import { TransportButton } from "../Buttons";
import { FastForward as FastFwdIcon, Rewind as RewindIcon } from "lucide-react";

type Props = {
  direction: string;
  amount: number;
};
export default function Seek({ direction }: Props) {
  const { send } = MixerContext.useActorRef();

  const amount = () => {
    if (t.seconds < 10) {
      return t.seconds;
    } else {
      return 10;
    }
  };

  const state = MixerContext.useSelector((state) => state);
  return (
    <TransportButton
      onClick={() => {
        console.log("state", state);
        console.log("state.context", state.context);
        console.log("trackMachineRefs", state.context.trackMachineRefs);

        const ubu = amount();
        console.log("ubu", ubu);
        send({ type: "SEEK", direction, amount: ubu });
      }}
    >
      {direction === "forward" ? <FastFwdIcon /> : <RewindIcon />}
    </TransportButton>
  );
}
