import { Track } from "../Track";
import Main from "../Main";
import Transport from "@/components/Transport";
import { MixerContext } from "../../machines/mixerMachine";
import { TrackContext } from "@/machines/trackMachine";

export default function Mixer() {
  const tracks = MixerContext.useSelector((s) => s.context?.sourceSong?.tracks);
  const channels = MixerContext.useSelector((s) => s.context?.channels);

  const ready = MixerContext.useSelector((state) => state.matches("ready"));

  // const state = MixerContext.useSelector((state) => state);
  // console.log("state", state);
  // console.log("state.context", state.context);
  // console.log("trackMachineRefs", state.context.trackMachineRefs);

  if (!ready) return null;

  return (
    <>
      <div className="channels">
        {tracks?.map((track: SourceTrack, i: number) => (
          <TrackContext.Provider
            key={track.id}
            options={{ input: { track, trackId: i, channel: channels[i] } }}
          >
            <Track />
          </TrackContext.Provider>
        ))}
        <Main />
      </div>
      <Transport />
    </>
  );
}
