import { automationMachine } from "@/machines/automationMachine";
import { Transport as t } from "tone";
import { TrackContext } from "@/machines/trackMachine";
import { useActorRef, useSelector } from "@xstate/react";
import { roundFourth } from "@/utils";
import { useCallback, useEffect, useState } from "react";
import localforage from "localforage";

type Props = {
  param: string;
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
        localforage.setItem(`${param}-${id}`, data);
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
function useRead({ trackId, playbackMode, param }) {
  const { send } = TrackContext.useActorRef();

  const setParam = useCallback(
    (data: { time: number; value: number }) => {
      t.schedule(() => {
        send({
          type: `CHANGE_${param.toUpperCase()}`,
          [param]: data.value,
        });
      }, data.time);
    },
    [send, param]
  );

  const [volumeData, setVolumeData] = useState([]);
  localforage.getItem(`${param}-${trackId}`).then((val) => {
    return setVolumeData(val);
  });

  useEffect(() => {
    if (playbackMode !== "reading" || !volumeData) return;

    // console.log("volumeData", volumeData);
    // console.log("trackId", trackId);
    // console.log("playbackMode", playbackMode);
    // console.log("param", param);

    for (const value of volumeData.values()) {
      console.log("value", value);
      setParam(value);
    }
  }, [trackId, param, setParam, playbackMode]);

  return null;
}

function AutomationMode({ param }: Props) {
  const automationActor = useActorRef(automationMachine);
  const send = automationActor.send;
  const state = useSelector(automationActor, (s) => s);

  const { volume, pan, trackId } = TrackContext.useSelector((s) => s.context);
  const [value, setValue] = useState(volume);

  useEffect(() => {
    switch (param) {
      case "volume":
        setValue(volume);
        break;
      case "pan":
        setValue(pan);
        break;
      default:
        break;
    }
  }, [param, pan, volume]);

  useWrite({ id: trackId, value, playbackMode: state.value, param });
  useRead({ trackId, playbackMode: state.value, param });

  function handleChange(e) {
    const value = e.currentTarget.value;
    switch (value) {
      case "off":
        send({ type: "TURN_OFF" });
        break;
      case "reading":
        send({ type: "READ" });
        break;
      case "writing":
        send({ type: "WRITE" });
        break;

      default:
        break;
    }
  }

  return (
    <div>
      <select onChange={handleChange} value={state.value}>
        <option value="off">OFF</option>
        <option value="reading">READ</option>
        <option value="writing">WRITE</option>
      </select>
    </div>
  );
}

export default AutomationMode;
