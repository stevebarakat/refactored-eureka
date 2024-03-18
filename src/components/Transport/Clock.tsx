import { useCallback, useState, useMemo } from "react";
import { Transport as t } from "tone";
import { formatMilliseconds } from "@/utils";
import { MixerContext } from "../../machines/mixerMachine";
import "./clock.css";

function Clock() {
  const { send } = MixerContext.useActorRef();
  const [clock, setClock] = useState(formatMilliseconds(0));
  const { sourceSong } = MixerContext.useSelector((state) => state.context);

  if (sourceSong) {
    if (t.seconds < 0 || t.seconds > sourceSong.endPosition) {
      send({ type: "RESET" });
    }
  }

  const animateClock = useCallback(() => {
    setClock(formatMilliseconds(t.seconds));
    requestAnimationFrame(animateClock);
  }, []);

  useMemo(() => requestAnimationFrame(animateClock), [animateClock]);

  return (
    <div className="clock">
      <div className="ghost">88:88:88</div>
      {clock}
    </div>
  );
}

export default Clock;
