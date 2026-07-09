// TapeGauge geometry — pure, React-free (plan/25 §19, plan/17 F1). Inverts the
// sparkline: the value is fixed at a pointer and the scale scrolls past it. A
// window `span` units tall/wide, centered on `value`: a thin zone stripe beside
// the pointer, tick marks + a few candidate labels in their own column, a fixed
// center pointer + readout, and a rate chevron (a SEPARATE channel from level).
// Ticks/labels are generated only within the window, so containment is by
// construction — no clipPath. 2-dp.
import { round2 } from "../../core/types.js";

export type Tone = "pos" | "neg" | "warn" | "neutral";
export type Orientation = "vertical" | "horizontal";

export interface Zone {
  from: number;
  to: number;
  tone: Tone;
}

export interface TapeRect {
  x: number;
  y: number;
  width: number;
  height: number;
  tone: Tone;
}

export interface TickLabel {
  text: number;
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
}

/** Thin coloured band beside the pointer (viewBox units). */
const ZONE = 2.4;

/** A "nice" tick step near `rough` (1/2/5 × 10ⁿ). */
export function niceStep(rough: number): number {
  if (!Number.isFinite(rough) || rough <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(rough));
  const f = rough / p;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
}

/** Signed chevron tier from a rate and [tier-1, tier-2] thresholds. */
export function chevronTier(rate: number, tiers: [number, number]): -2 | -1 | 0 | 1 | 2 {
  if (!Number.isFinite(rate) || rate === 0) return 0;
  const a = Math.abs(rate);
  const t = a < tiers[0] ? 0 : a < tiers[1] ? 1 : 2;
  return (rate > 0 ? t : -t) as -2 | -1 | 0 | 1 | 2;
}

export function tapeGaugeGeometry(opts: {
  value: number;
  span: number;
  zones: readonly Zone[];
  tick: number | null;
  width: number;
  height: number;
  orientation: Orientation;
}): {
  zoneRects: TapeRect[];
  tickPath: string;
  tickLabels: TickLabel[];
  /** Right/bottom edge of the scale column (label anchor line). */
  scaleEdge: number;
  pointer: { path: string; labelX: number; labelY: number };
  /** Center of the readout gutter and its available extent (for font fitting). */
  readout: { gutter: number };
  window: [number, number];
  containingZone: Zone | null;
} {
  const { value, span, zones, tick, width, height, orientation } = opts;
  const vertical = orientation !== "horizontal";
  const pad = 1;
  const lo = value - span / 2;
  const hi = value + span / 2;

  // scale column: vertical → left of the pointer; horizontal → above it
  const tapeExtent = vertical ? width * 0.56 : height * 0.56;
  const scaleEdge = round2(tapeExtent - ZONE); // ticks + labels live left/above of the zone stripe
  const along = vertical ? height : width;
  const alongInner = along - pad * 2;
  // position along the scale axis (vertical: top = hi; horizontal: left = lo)
  const posOf = (v: number): number =>
    vertical
      ? round2(pad + ((hi - v) / span) * alongInner)
      : round2(pad + ((v - lo) / span) * alongInner);

  const step = tick && tick > 0 ? tick : niceStep(span / 5);
  const first = Math.ceil(lo / step) * step;
  const ticks: number[] = [];
  for (let t = first; t <= hi + 1e-9; t += step) ticks.push(round2(t));

  // zone stripe: a thin band hugging the pointer, clipped to the window
  const zoneRects: TapeRect[] = [];
  for (const z of zones) {
    const a = Math.max(lo, Math.min(z.from, z.to));
    const b = Math.min(hi, Math.max(z.from, z.to));
    if (b <= a) continue;
    if (vertical) {
      const y0 = posOf(b);
      const y1 = posOf(a);
      zoneRects.push({ x: scaleEdge, y: y0, width: ZONE, height: round2(y1 - y0), tone: z.tone });
    } else {
      const x0 = posOf(a);
      const x1 = posOf(b);
      zoneRects.push({ x: x0, y: scaleEdge, width: round2(x1 - x0), height: ZONE, tone: z.tone });
    }
  }

  // ticks (one path) + candidate labels (the component thins them to what fits)
  let tickPath = "";
  const tickLabels: TickLabel[] = [];
  const labelEvery = Math.max(1, Math.round(ticks.length / 3));
  ticks.forEach((t, i) => {
    if (vertical) {
      const y = posOf(t);
      tickPath += `M${round2(scaleEdge - 2.5)} ${y}H${scaleEdge}`;
      if (i % labelEvery === 0)
        tickLabels.push({ text: t, x: round2(scaleEdge - 3.2), y, anchor: "end" });
    } else {
      const x = posOf(t);
      tickPath += `M${x} ${round2(scaleEdge - 2.5)}V${scaleEdge}`;
      if (i % labelEvery === 0)
        tickLabels.push({ text: t, x, y: round2(scaleEdge - 3.2), anchor: "middle" });
    }
  });

  // fixed center pointer + readout box
  let pointer: { path: string; labelX: number; labelY: number };
  if (vertical) {
    const y = round2(height / 2);
    pointer = {
      path: `M${round2(tapeExtent)} ${y}l3 -2.5v5z`, // triangle pointing left into the tape
      labelX: round2((tapeExtent + width) / 2),
      labelY: y,
    };
  } else {
    const x = round2(width / 2);
    pointer = {
      path: `M${x} ${round2(tapeExtent)}l-2.5 3h5z`,
      labelX: x,
      labelY: round2((tapeExtent + height) / 2),
    };
  }
  const gutter = vertical ? round2(width - tapeExtent) : round2(width);

  const containingZone =
    zones.find((z) => value >= Math.min(z.from, z.to) && value <= Math.max(z.from, z.to)) ?? null;

  return {
    zoneRects,
    tickPath,
    tickLabels,
    scaleEdge,
    pointer,
    readout: { gutter },
    window: [round2(lo), round2(hi)],
    containingZone,
  };
}
