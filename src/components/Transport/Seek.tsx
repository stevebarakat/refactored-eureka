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

  const canSeek = MixerContext.useSelector((state) =>
    state.matches({ ready: { transportMachine: "started" } })
  );

  return (
    <TransportButton
      onClick={() => {
        const dynamicAmount = () => {
          if (canSeek && direction === "forward") {
            return amount;
          } else {
            if (t.seconds < amount) {
              return t.seconds;
            } else {
              return amount;
            }
          }
        };
        send({ type: "SEEK", direction, amount: dynamicAmount() });
      }}
    >
      {direction === "forward" ? <FastFwdIcon /> : <RewindIcon />}
    </TransportButton>
  );
}
