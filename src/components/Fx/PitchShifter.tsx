import { PitchContext } from "@/components/Fx/pitchShiftMachine";
import { roundFourth } from "@/utils";
import { Transport as t } from "tone";
import localforage from "localforage";
import { useEffect, useCallback, useState, useRef } from "react";
import { PitchShift } from "tone";

type Props = {
  pitchShift: PitchShift;
  trackId: number;
};

// !!! --- WRITE --- !!! //
const data = new Map<number, object>();
function useWrite({ id, value, playbackMode, param }: WriteProps) {
  useEffect(() => {
    if (playbackMode !== "writing") return;

    const loop = t.scheduleRepeat(
      () => {
        const time: number = roundFourth(t.seconds);
        data.set(time, { id, time, value });
        localforage.setItem(`pitchData-${id}`, data);
      },
      0.25,
      0
    );

    return () => {
      t.clear(loop);
    };
  }, [id, value, playbackMode, param]);

  return data;
}

// !!! --- READ --- !!! //
function useRead({ trackId, playbackMode, pitchShift }) {
  const { send } = PitchContext.useActorRef();
  const loop = useRef(0);

  const setParam = useCallback(
    (data: { time: number; value: { mix: number; pitch: number } }) => {
      loop.current = t.schedule(() => {
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

  const [pitchData, setPitchData] = useState([]);
  localforage.getItem(`pitchData-${trackId}`).then((val) => {
    // console.log("val", val);
    return setPitchData(val);
  });

  useEffect(() => {
    console.log("playbackMode", playbackMode);
    if (playbackMode !== "reading" || !pitchData) return;

    // console.log("pitchData", pitchData);
    // console.log("trackId", trackId);
    // console.log("playbackMode", playbackMode);
    // console.log("param", param);

    for (const value of pitchData.values()) {
      console.log("value", value);
      setParam(value);
    }
    return () => {
      t.clear(loop.current);
    };
  }, [trackId, pitchData, setParam, playbackMode]);

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
  useRead({ trackId, playbackMode, param, pitchShift });

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
