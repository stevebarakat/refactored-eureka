import { MixerContext } from "@/machines/mixerMachine";
import { Transport as t } from "tone";
import { TransportButton } from "../Buttons";
import { FastForward as FastFwdIcon, Rewind as RewindIcon } from "lucide-react";

type Props = {
  direction: string;
  amount: number;
};

export default function Seek({ direction, amount }: Props) {
  const { send } = MixerContext.useActorRef();

  const canSeek = MixerContext.useSelector(
    (state) =>
      state.matches({ ready: "started" }) || state.matches({ ready: "paused" })
  );

  return (
    <TransportButton
      onClick={() => {
        const dynamicAmount = () => {
          if (canSeek && direction === "forward") {
            return amount;
          } else {
            return t.seconds < amount ? t.seconds : amount;
          }
        };
        send({ type: "SEEK", direction, amount: dynamicAmount() });
      }}
    >
      {direction === "forward" ? <FastFwdIcon /> : <RewindIcon />}
    </TransportButton>
  );
}
