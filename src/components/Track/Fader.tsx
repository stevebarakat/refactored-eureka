import { TrackContext } from "@/machines/trackMachine";
import { ReactNode, isValidElement } from "react";

type Props = {
  children: ReactNode;
};

function Fader({ children }: Props) {
  const { send } = TrackContext.useActorRef();
  const { volume } = TrackContext.useSelector((state) => state.context);

  const height =
    (isValidElement(children) && children.props.options?.height) - 4 || 194;

  return (
    <>
      {children}
      <div className="vol-wrap">
        <input
          type="range"
          min={-100}
          max={0}
          className="range-y volume"
          style={{ width: height, top: height / 1.5 }}
          value={volume}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            send({ type: "CHANGE_VOLUME", volume: value });
          }}
        />
      </div>
    </>
  );
}

export default Fader;
