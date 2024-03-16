import { MixerContext } from "@/machines/mixerMachine";
import Solo from "./Solo";
import Mute from "./Mute";

function SoloMute() {
  return (
    <div className="flex gap8">
      <MixerContext.Provider>
        <Solo />
        <Mute />
      </MixerContext.Provider>
    </div>
  );
}

export default SoloMute;
