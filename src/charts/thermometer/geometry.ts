// Thermometer geometry — pure, React-free (plan/24 #5, S4). A calibrated linear
// tube: fill anchors at domain[0], never re-zeroed, never log — ticks calibrate
// the read (that's what buys the high precision). The bulb is instrument chrome
// (always full), never data. The fill rect width == the tube inner width, so no
// clipPath/id is needed. Works vertical (default) or horizontal. All coords 2-dp.
import { clamp, scaleLinear } from "../../core/scale.js";
import { round2 } from "../../core/types.js";
import type { Orientation } from "../../core/types.js";

export type { Orientation } from "../../core/types.js";

export interface ThermometerGeometry {
  /** Tube + fill are rounded-rect capsules (rx = r) so the ends read closed. */
  tube: { x: number; y: number; width: number; height: number; r: number };
  fill: { x: number; y: number; width: number; height: number; r: number };
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

  // along-axis endpoints (bulb sits at the low end). Tube + fill are rounded-rect
  // capsules, so the rounded end is drawn INSIDE the rect — no cap overflow, and
  // the far end reads cleanly closed. The tube overlaps the bulb by r so they fuse.
  const r = tubeHalf;
  const alongLo = vertical ? height - pad - bulbR : pad + bulbR; // domain[0], bulb centre
  const alongHi = vertical ? pad : width - pad; // domain[1]
  const scale = scaleLinear(domain, [alongLo, alongHi]);
  const clamped = clamp(value, domain[0], domain[1]);
  const edge = round2(scale(clamped));
  const overflow = value < domain[0] || value > domain[1];

  // tube capsule (rounded rect, rx = r) spanning the full scale.
  const tube = vertical
    ? {
        x: round2(acrossMid - r),
        y: alongHi,
        width: round2(r * 2),
        height: round2(alongLo - alongHi),
        r,
      }
    : {
        x: alongLo,
        y: round2(acrossMid - r),
        width: round2(alongHi - alongLo),
        height: round2(r * 2),
        r,
      };

  // fill capsule — from the bulb (low) end to the value edge.
  const fill = vertical
    ? {
        x: round2(acrossMid - r),
        y: edge,
        width: round2(r * 2),
        height: round2(alongLo - edge),
        r,
      }
    : {
        x: alongLo,
        y: round2(acrossMid - r),
        width: round2(edge - alongLo),
        height: round2(r * 2),
        r,
      };

  // ticks — short marks on one side of the tube, evenly aligned.
  const tickLen = round2(acrossFull * 0.16);
  const tv = ticksToValues(ticks, domain);
  const tickLines = tv.map((t) => {
    const a = round2(scale(t));
    return vertical
      ? { x1: round2(acrossMid + r + 1), y1: a, x2: round2(acrossMid + r + 1 + tickLen), y2: a }
      : { x1: a, y1: round2(acrossMid + r + 1), x2: a, y2: round2(acrossMid + r + 1 + tickLen) };
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
