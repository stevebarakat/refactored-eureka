import { Toggle } from "../Buttons";
import { TrackContext } from "@/machines/trackMachine";

function Solo() {
  const { track } = TrackContext.useSelector((state) => state.context);

  const { send } = TrackContext.useActorRef();
  const isActive = TrackContext.useSelector((state) =>
    state.matches({ solo: "active" })
  );

  return (
    <Toggle
      id={`trackSolo${track.id}`}
      checked={isActive}
      onChange={() => {
        send({
          type: "TOGGLE_SOLO",
        });
      }}
    >
      S
    </Toggle>
  );
}

export default Solo;
