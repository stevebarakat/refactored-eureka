import { useCallback, useState, useMemo, useRef } from "react";
import { Transport as t } from "tone";
import { formatMilliseconds } from "@/utils";
import { MixerContext } from "../../machines/mixerMachine";
import "./clock.css";

function Clock() {
  const animationFrame = useRef(0);
  const { send } = MixerContext.useActorRef();
  const [clock, setClock] = useState(formatMilliseconds(0));
  const { sourceSong } = MixerContext.useSelector((state) => state.context);

  const animateClock = useCallback(() => {
    if (sourceSong) {
      if (t.seconds > sourceSong.endPosition) {
        cancelAnimationFrame(animationFrame.current);
        send({ type: "RESET" });
      }
    }
    setClock(formatMilliseconds(t.seconds));
    animationFrame.current = requestAnimationFrame(animateClock);
  }, [send, sourceSong]);

  useMemo(() => requestAnimationFrame(animateClock), [animateClock]);

  return (
    <div className="clock">
      <div className="ghost">88:88:88</div>
      {clock}
    </div>
  );
}

export default Clock;
