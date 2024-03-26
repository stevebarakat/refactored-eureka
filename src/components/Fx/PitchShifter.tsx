import { PitchContext } from "@/components/Fx/pitchShiftMachine";
import { roundFourth } from "@/utils";
import localforage from "localforage";
import { useEffect, useCallback, useState, useRef } from "react";
import { type PitchShift, Transport as t, Loop } from "tone";

type Props = {
  pitchShift: PitchShift;
  trackId: number;
};

type ReadProps = Props & { playbackMode: "reading" | "writing" | "off" };

type WriteProps = {
  id: number;
  value: PitchData;
  playbackMode: string;
  param: string;
};

type PitchData = { mix: number; pitch: number };

type PitchAutomationData = {
  time: number;
  value: PitchData;
};

// !!! --- WRITE --- !!! //
const data = new Map<number, object>();
function useWrite({ id, value, playbackMode, param }: WriteProps) {
  useEffect(() => {
    if (playbackMode !== "writing") return;

    const loop = new Loop(() => {
      const time: number = roundFourth(t.seconds);
      data.set(time, { id, time, value });
      localforage.setItem(`pitchData-${id}`, data);
    }, 0.25).start();

    return () => {
      loop.dispose();
    };
  }, [id, value, playbackMode, param]);

  return data;
}

// !!! --- READ --- !!! //
function useRead({ trackId, playbackMode, pitchShift }: ReadProps) {
  const { send } = PitchContext.useActorRef();
  const loop = useRef(0);

  const setData = useCallback(
    (data: { time: number; value: { mix: number; pitch: number } }) => {
      loop.current = t.scheduleOnce(() => {
        send({
          type: "CHANGE_MIX",
          mix: data.value.mix,
          pitchShift,
        });
        send({
          type: "CHANGE_PITCH",
          pitch: data.value.pitch,
          pitchShift,
        });
      }, data.time);
    },
    [send, pitchShift]
  );

  const [pitchData, setPitchData] = useState<Map<
    number,
    PitchAutomationData
  > | null>();
  localforage
    .getItem<Map<number, PitchAutomationData>>(`pitchData-${trackId}`)
    .then((val) => setPitchData(val));

  useEffect(() => {
    if (playbackMode !== "reading" || !pitchData) return;

    for (const value of pitchData.values()) {
      setData(value);
    }
    return () => {
      t.clear(loop.current);
    };
  }, [trackId, setData, playbackMode]);

  return null;
}

function PitchShifter({ pitchShift, trackId }: Props) {
  const [param, setParam] = useState("mix");
  const { send } = PitchContext.useActorRef();
  const playbackMode = PitchContext.useSelector((s) => s.value);
  const { context } = PitchContext.useSelector((s) => s);

  useWrite({
    id: trackId,
    value: context.pitchData,
    playbackMode,
    param,
  });
  useRead({ trackId, playbackMode, pitchShift });

  return (
    <div>
      <h3>PitchShifter</h3>
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
          id="mix"
          value={context.pitchData.mix}
          onPointerDown={() => setParam("mix")}
          onChange={(e) => {
            send({
              type: "CHANGE_MIX",
              mix: parseFloat(e.currentTarget.value),
              pitchShift,
            });
          }}
        />
      </div>
      <div className="flex-y">
        <label htmlFor="pitch">Pitch:</label>
        <input
          min={-36}
          max={36}
          step={1}
          type="range"
          id="pitch"
          value={context.pitchData.pitch}
          onPointerDown={() => setParam("pitch")}
          onChange={(e) => {
            send({
              type: "CHANGE_PITCH",
              pitch: parseFloat(e.currentTarget.value),
              pitchShift,
            });
          }}
        />
      </div>
    </div>
  );
}

export default PitchShifter;
