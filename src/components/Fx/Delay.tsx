import { DelayContext } from "@/components/Fx/delayMachine";
import { type FeedbackDelay, Transport as t, Loop } from "tone";
import { useEffect, useCallback, useState, useRef } from "react";
import { roundFourth } from "@/utils";
import localforage from "localforage";

type Props = {
  delay: FeedbackDelay;
  trackId: number;
};

type ReadProps = Props & { playbackMode: "reading" | "writing" | "off" };

type WriteProps = {
  id: number;
  value: DelayData;
  playbackMode: string;
  param: string;
};

type DelayData = { mix: number; delayTime: number; feedback: number };

type DelayAutomationData = {
  time: number;
  value: DelayData;
};

// !!! --- WRITE --- !!! //
const data = new Map<number, object>();
function useWrite({ id, value, playbackMode, param }: WriteProps) {
  useEffect(() => {
    if (playbackMode !== "writing") return;

    const loop = new Loop(() => {
      const time: number = roundFourth(t.seconds);
      data.set(time, { id, time, value });
      localforage.setItem(`delayData-${id}`, data);
    }, 0.25).start();

    return () => {
      loop.dispose();
    };
  }, [id, value, playbackMode, param]);

  return data;
}

// !!! --- READ --- !!! //
function useRead({ trackId, playbackMode, delay }: ReadProps) {
  const { send } = DelayContext.useActorRef();
  const loop = useRef(0);

  const setData = useCallback(
    (data: {
      time: number;
      value: { mix: number; delayTime: number; feedback: number };
    }) => {
      loop.current = t.scheduleOnce(() => {
        send({
          type: "CHANGE_MIX",
          mix: data.value.mix,
          delay,
        });
        send({
          type: "CHANGE_TIME",
          delayTime: data.value.delayTime,
          delay,
        });
        send({
          type: "CHANGE_FEEDBACK",
          feedback: data.value.feedback,
          delay,
        });
      }, data.time);
    },
    [send, delay]
  );

  const [delayData, setDelayData] = useState<Map<
    number,
    DelayAutomationData
  > | null>();
  localforage
    .getItem<Map<number, DelayAutomationData>>(`delayData-${trackId}`)
    .then((val) => setDelayData(val));

  useEffect(() => {
    if (playbackMode !== "reading" || !delayData) return;

    for (const value of delayData.values()) {
      setData(value);
    }
    return () => {
      t.clear(loop.current);
    };
  }, [trackId, setData, playbackMode]);

  return null;
}

function Delay({ delay, trackId }: Props) {
  const [param, setParam] = useState("mix");
  const { send } = DelayContext.useActorRef();
  const playbackMode = DelayContext.useSelector((s) => s.value);
  const { context } = DelayContext.useSelector((s) => s);

  console.log("context", context);

  useWrite({
    id: trackId,
    value: context.delayData,
    playbackMode,
    param,
  });
  useRead({ trackId, playbackMode, delay });

  return (
    <div>
      <h3>Delay</h3>
      <select
        value={playbackMode}
        onChange={(e) => {
          const value = e.target.value;
          switch (value) {
            case "off":
              return send({ type: "TURN_OFF" });
            case "reading":
              return send({ type: "READ" });
            case "writing":
              return send({ type: "WRITE" });
            default:
              break;
          }
        }}
      >
        <option value="off">off</option>
        <option value="reading">read</option>
        <option value="writing">write</option>
      </select>
      <div className="flex-y">
        <label htmlFor="mix">Mix:</label>
        <input
          min={0}
          max={1}
          step={0.01}
          type="range"
          name="mix"
          id="mix"
          value={context.delayData.mix}
          onPointerDown={() => setParam("mix")}
          onChange={(e) =>
            send({
              type: "CHANGE_MIX",
              mix: parseFloat(e.currentTarget.value),
              delay,
            })
          }
        />
      </div>
      <div className="flex-y">
        <label htmlFor="delayTime">Delay Time:</label>
        <input
          min={0}
          max={1}
          step={0.01}
          type="range"
          name="delayTime"
          id="delayTime"
          value={context.delayData.delayTime}
          onPointerDown={() => setParam("delayTime")}
          onChange={(e) =>
            send({
              type: "CHANGE_TIME",
              delayTime: parseFloat(e.currentTarget.value),
              delay,
            })
          }
        />
      </div>
      <div className="flex-y">
        <label htmlFor="feedback">Feedback:</label>
        <input
          min={0}
          max={1}
          step={0.01}
          type="range"
          name="feedback"
          id="feedback"
          value={context.delayData.feedback}
          onPointerDown={() => setParam("feedback")}
          onChange={(e) =>
            send({
              type: "CHANGE_FEEDBACK",
              feedback: parseFloat(e.currentTarget.value),
              delay,
            })
          }
        />
      </div>
    </div>
  );
}

export default Delay;
