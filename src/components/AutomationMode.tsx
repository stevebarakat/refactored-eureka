import { automationMachine } from "@/machines/automationMachine";
import { Transport as t } from "tone";
import { TrackContext } from "@/machines/trackMachine";
import { useActorRef, useSelector } from "@xstate/react";
import { roundFourth } from "@/utils";
import { useCallback, useEffect, useState } from "react";
import localforage from "localforage";

type Props = {
  trackId: number;
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
          type: "CHANGE_VOLUME",
          volume: data.value,
        });
      }, data.time);
    },
    [send]
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

function AutomationMode({ trackId, param }: Props) {
  const automationActor = useActorRef(automationMachine);
  const send = automationActor.send;
  const state = useSelector(automationActor, (s) => s);

  const { volume } = TrackContext.useSelector((s) => s.context);

  // console.log("state", state.value);

  useWrite({ id: trackId, value: volume, playbackMode: state.value, param });
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
