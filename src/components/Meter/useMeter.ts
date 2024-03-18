import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Meter } from "tone";

const MAX_BOX_COUNT = 100;
const METER_OFFSET = 85;

// Colors
const hiOn = "hsla(250, 80%, 70%, 0.9)";
const hiOff = "hsla(250, 80%, 70%, 0.5)";
const midOn = "hsla(285, 90%, 70%, 0.9)";
const midOff = "hsla(285, 90%, 70%, 0.5)";
const lowOn = "hsla(330, 100%, 70%, 0.9)";
const lowOff = "hsla(330, 100%, 70%, 0.5)";

type Props = {
  channel: Channel | Destination | undefined;
  canvas: React.MutableRefObject<HTMLCanvasElement | null>;
  options: MeterOptions | undefined;
};

function useMeter({ channel, canvas, options }: Props) {
  const [meterVal, setMeterVal] = useState<number>();
  const meter = useRef<Meter | undefined>();
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    meter.current = new Meter({ channels: 2 });
    channel?.connect(meter.current);
  }, [channel]);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");

    const width = options?.width ?? 12;
    const height = (options?.height || 200) - 4;

    const boxCount = options?.total ?? 50;
    const boxCountMid = options?.midCount ?? 20;
    const boxCountHi = options?.highCount ?? 10;

    const boxGap = (options?.gap && options.gap * 0.1) ?? 0.1;

    const boxHeight = height / (boxCount + (boxCount + 1) * boxGap);
    const boxGapY = boxHeight * boxGap;

    const boxWidth = width - boxGapY * 2;
    const boxGapX = (width - boxWidth) / 2;

    const getBoxColor = (id: number, val: number) => {
      if (id > boxCount - boxCountHi) {
        return id <= Math.ceil((val / MAX_BOX_COUNT) * boxCount) ? hiOn : hiOff;
      }
      if (id > boxCount - boxCountHi - boxCountMid) {
        return id <= Math.ceil((val / MAX_BOX_COUNT) * boxCount)
          ? midOn
          : midOff;
      }
      return id <= Math.ceil((val / MAX_BOX_COUNT) * boxCount) ? lowOn : lowOff;
    };

    function drawMeter() {
      if (!canvas.current || ctx == null)
        throw new Error("Could not get canvas context");
      const meterValue: number =
        Number(canvas.current.dataset.meterlevel) + METER_OFFSET;

      // Draw the container
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, width, height);
      ctx.fillStyle = "hsl(0, 0%, 2%)";
      ctx.fill();
      ctx.restore();

      // Draw the boxes
      ctx.save();
      ctx.translate(boxGapX, boxGapY);
      for (let i = 0; i < boxCount; i++) {
        const id = Math.abs(i - (boxCount - 1)) + 1;

        ctx.beginPath();
        ctx.rect(0, 0, boxWidth, boxHeight);
        ctx.fillStyle = getBoxColor(id, meterValue);
        ctx.fill();
        ctx.translate(0, boxHeight + boxGapY);
      }
      ctx.restore();
      animationFrame.current = requestAnimationFrame(drawMeter);
    }

    drawMeter();

    return () => {
      animationFrame.current && cancelAnimationFrame(animationFrame.current);
    };
  }, [options, canvas]);

  const animateMeter = useCallback(() => {
    const vals = meter.current?.getValue();
    if (typeof vals === "number") return;
    vals?.forEach((val) => {
      if (val < -500) return;
      setMeterVal(val);
    });

    requestAnimationFrame(animateMeter);
  }, []);

  useMemo(() => requestAnimationFrame(animateMeter), [animateMeter]);

  return meterVal;
}

export default useMeter;
