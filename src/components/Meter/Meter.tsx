import { useRef } from "react";
import useMeter from "./useMeter";

function VuMeter({ channel, options }: MeterProps) {
  const canvas = useRef<HTMLCanvasElement | null>(null);

  const width = options?.width || 12;
  const height = (options?.height || 200) - width;
  const meterVal = useMeter({ channel, canvas, options });

  return (
    <canvas
      className="meter-wrap"
      ref={canvas}
      width={width}
      height={height}
      data-meterlevel={meterVal}
    />
  );
}

export default VuMeter;
