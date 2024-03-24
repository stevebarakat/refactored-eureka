import { Pan, Fader, SoloMute } from ".";
import Meter from "../Meter";
import ChannelLabel from "../ChannelLabel";
import { FxPanel } from "../FxPanel";
import { FxSelector } from "../Selectors";
import { TrackContext } from "@/machines/trackMachine";
import AutomationMode from "../AutomationMode";

export default function Track({ trackId }: { trackId: number }) {
  const { context } = TrackContext.useSelector((s) => s);
  const { channel, track, fx } = context;

  fx && channel?.chain(...fx);

  return (
    <>
      <div className="channel-wrap">
        <FxPanel trackId={trackId} />
        <FxSelector trackId={trackId} />
        <div className="channel">
          <Pan trackId={trackId} />
          <Fader>
            <Meter channel={channel} />
          </Fader>
          <SoloMute />
          <ChannelLabel name={track?.name || `track ${trackId + 1}`} />
        </div>
        <AutomationMode trackId={trackId} param="volume" />
      </div>
    </>
  );
}
