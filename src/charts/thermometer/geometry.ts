// Thermometer geometry — pure, React-free (plan/24 #5, S4). A calibrated linear
// tube: fill anchors at domain[0], never re-zeroed, never log — ticks calibrate
// the read (that's what buys the high precision). The bulb is instrument chrome
// (always full), never data. The fill rect width == the tube inner width, so no
// clipPath/id is needed. Works vertical (default) or horizontal. All coords 2-dp.
import { clamp, scaleLinear } from "../../core/scale.js";
import { round2 } from "../../core/types.js";

export type Orientation = "vertical" | "horizontal";

export interface ThermometerGeometry {
  tube: string;
  fill: { x: number; y: number; width: number; height: number };
  bulb: { cx: number; cy: number; r: number } | null;
  tickLines: { x1: number; y1: number; x2: number; y2: number }[];
  targetTick: { x1: number; y1: number; x2: number; y2: number } | null;
  /** Value sits outside the domain (fill clamps; summary keeps the truth). */
  overflow: boolean;
  /** where the fill edge lands (for the interactive value label). */
  fillEdge: number;
}

function ticksToValues(
  ticks: number | readonly number[],
  domain: readonly [number, number],
): number[] {
  if (Array.isArray(ticks)) return ticks.filter((t) => t >= domain[0] && t <= domain[1]);
  const n = Math.max(2, Math.floor(ticks as number));
  const [d0, d1] = domain;
  return Array.from({ length: n }, (_, i) => d0 + ((d1 - d0) * i) / (n - 1));
}

export function thermometerGeometry(opts: {
  value: number;
  domain: readonly [number, number];
  target?: number | undefined;
  ticks: number | readonly number[];
  width: number;
  height: number;
  orientation: Orientation;
  bulb: boolean;
  pad: number;
}): ThermometerGeometry {
  const { value, domain, target, ticks, width, height, orientation, bulb, pad } = opts;
  const vertical = orientation === "vertical";
  // "along" = the scale axis length; "across" = the tube thickness
  const acrossFull = vertical ? width : height;
  const bulbR = bulb ? round2(acrossFull * 0.32) : 0;
  const tubeHalf = round2(acrossFull * 0.16);
  const acrossMid = round2(acrossFull / 2);

  // along-axis endpoints (bulb sits at the low end). The horizontal low end has a
  // rounded cap that bulges out by the tube radius, so when there's no bulb to
  // cover it the low end must still reserve that cap (else it spills off the left).
  const capLo = Math.max(bulbR, tubeHalf * 2);
  const alongLo = vertical ? height - pad - bulbR : pad + capLo; // domain[0]
  const alongHi = vertical ? pad : width - pad; // domain[1]
  const scale = scaleLinear(domain, [alongLo, alongHi]);
  const clamped = clamp(value, domain[0], domain[1]);
  const edge = round2(scale(clamped));
  const overflow = value < domain[0] || value > domain[1];

  // fill rect (from the bulb end to the value edge)
  const fill = vertical
    ? {
        x: round2(acrossMid - tubeHalf),
        y: edge,
        width: round2(tubeHalf * 2),
        height: round2(alongLo - edge),
      }
    : {
        x: alongLo,
        y: round2(acrossMid - tubeHalf),
        width: round2(edge - alongLo),
        height: round2(tubeHalf * 2),
      };

  // tube outline — a capsule along the axis (rounded ends), stroked over the fill
  const r = tubeHalf;
  const tube = vertical
    ? `M${round2(acrossMid - r)} ${alongLo}L${round2(acrossMid - r)} ${round2(alongHi + r)}` +
      `A${r} ${r} 0 0 1 ${round2(acrossMid + r)} ${round2(alongHi + r)}L${round2(acrossMid + r)} ${alongLo}`
    : `M${alongHi} ${round2(acrossMid - r)}L${round2(alongLo - r)} ${round2(acrossMid - r)}` +
      `A${r} ${r} 0 0 0 ${round2(alongLo - r)} ${round2(acrossMid + r)}L${alongHi} ${round2(acrossMid + r)}`;

  // ticks — short marks on one side of the tube, one merged path
  const tv = ticksToValues(ticks, domain);
  const tickLines = tv.map((t) => {
    const a = round2(scale(t));
    return vertical
      ? { x1: round2(acrossMid + r), y1: a, x2: round2(acrossMid + r + acrossFull * 0.14), y2: a }
      : { x1: a, y1: round2(acrossMid + r), x2: a, y2: round2(acrossMid + r + acrossFull * 0.14) };
  });

  // target — a line ACROSS the tube (distinct shape from side ticks)
  let targetTick: ThermometerGeometry["targetTick"] = null;
  if (target !== undefined && Number.isFinite(target)) {
    const a = round2(scale(clamp(target, domain[0], domain[1])));
    targetTick = vertical
      ? { x1: round2(acrossMid - r - 1), y1: a, x2: round2(acrossMid + r + 1), y2: a }
      : { x1: a, y1: round2(acrossMid - r - 1), x2: a, y2: round2(acrossMid + r + 1) };
  }

  const bulbGeo = bulb
    ? { cx: vertical ? acrossMid : alongLo, cy: vertical ? alongLo : acrossMid, r: bulbR }
    : null;

  return { tube, fill, bulb: bulbGeo, tickLines, targetTick, overflow, fillEdge: edge };
}
