import { Pan, Fader, SoloMute } from ".";
import Meter from "../Meter";
import ChannelLabel from "../ChannelLabel";
import { FxPanel } from "../FxPanel";
import { FxSelector } from "../Selectors";
import { ToggleContext } from "@/machines/toggleMachine";
import { TrackContext } from "@/machines/trackMachine";

export default function Track({ trackId }: { trackId: number }) {
  const { context } = TrackContext.useSelector((s) => s);
  const { channel, track, fx } = context;

  fx && channel?.chain(...fx);

  return (
    <>
      <div className="channel-wrap">
        <ToggleContext.Provider>
          <FxPanel trackId={trackId} />
          <FxSelector trackId={trackId} />
        </ToggleContext.Provider>
        <div className="channel">
          <Pan />
          <Fader>
            <Meter channel={channel} />
          </Fader>
          <SoloMute />
          <ChannelLabel name={track?.name || `track ${trackId + 1}`} />
        </div>
      </div>
    </>
  );
}
