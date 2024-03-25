import { Pan, Fader, SoloMute } from ".";
import Meter from "../Meter";
import ChannelLabel from "../ChannelLabel";
import { FxPanel } from "../FxPanel";
import { FxSelector } from "../Selectors";
import { TrackContext } from "@/machines/trackMachine";
import AutomationMode from "../AutomationMode";

export default function Track() {
  const { context } = TrackContext.useSelector((s) => s);
  const { channel, track, fx, trackId } = context;

  fx && channel?.chain(...fx);

  return (
    <>
      <div className="channel-wrap">
        <FxPanel />
        <FxSelector />
        <div className="channel">
          <Pan />
          <Fader>
            <Meter channel={channel} />
          </Fader>
          <SoloMute />
          <ChannelLabel name={track?.name || `track ${trackId + 1}`} />
        </div>
        <AutomationMode param="volume" />
      </div>
    </>
  );
}
