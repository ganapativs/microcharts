// TapeGauge geometry — pure, React-free. Inverts the
// sparkline: the value is fixed at a pointer and the scale scrolls past it. A
// window `span` units tall/wide, centered on `value`: a thin zone stripe beside
// the pointer, tick marks + a few candidate labels in their own column, a fixed
// center pointer + readout, and a rate chevron (a SEPARATE channel from level).
// Ticks/labels are generated only within the window, so containment is by
// construction — no clipPath. 2-dp.
import { isFiniteValue, round2 } from "../../core/types.js";
import type { Orientation } from "../../core/types.js";

export type { Orientation } from "../../core/types.js";

export type Tone = "pos" | "neg" | "warn" | "neutral";

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

/** Empty zone list. Shared by BOTH entries so their defaults are one array:
 *  a literal `[]` default is a fresh array per render, which defeats the
 *  interactive entry's geometry memo (and drifts the two entries apart). */
export const NO_ZONES: readonly Zone[] = [];
/** Hard ceiling on emitted ticks — a tape this dense is unreadable long before
 *  it is slow, and the cap is what keeps a pathological `span`/`tick` bounded. */
const MAX_TICKS = 200;

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
  /**
   * The readout's own box: `gutter` is the extent ACROSS the scale axis (for
   * fitting the number's width), `band` the extent ALONG the readout's line —
   * the vertical room a horizontal gauge leaves under the tape column, or the
   * whole height when the readout rides the midline of a vertical one. Both are
   * needed: sizing a hero number by width alone let it outgrow a short box.
   */
  readout: { gutter: number; band: number };
  window: [number, number];
  containingZone: Zone | null;
} {
  const { value, span, zones, tick, width, height, orientation } = opts;
  const vertical = orientation !== "horizontal";
  const pad = 1;
  const lo = value - span / 2;
  const hi = value + span / 2;

  // scale column: vertical → left of the pointer; horizontal → above it. Kept
  // narrow so the readout gutter beside it can seat a legible value.
  const tapeExtent = vertical ? width * 0.46 : height * 0.46;
  const scaleEdge = round2(tapeExtent - ZONE); // ticks + labels live left/above of the zone stripe
  const along = vertical ? height : width;
  const alongInner = along - pad * 2;
  // position along the scale axis (vertical: top = hi; horizontal: left = lo)
  const posOf = (v: number): number =>
    vertical
      ? round2(pad + ((hi - v) / span) * alongInner)
      : round2(pad + ((v - lo) / span) * alongInner);

  const step = tick && tick > 0 ? tick : niceStep(span / 5);
  // COUNT the ticks, never walk `t += step` to a bound: at large `value` the
  // step is smaller than one ULP of `t`, so the accumulator stops advancing and
  // the loop never terminates — the tab hangs, then dies on `Invalid array
  // length` (reproduced with value 1e17 / span 10, and with a non-finite
  // value, which `zones`-derived auto-span can also produce). Counting also
  // caps the work at a tick density anyone can read.
  const ticks: number[] = [];
  if (Number.isFinite(lo) && Number.isFinite(hi) && Number.isFinite(step) && step > 0) {
    const first = Math.ceil(lo / step) * step;
    const n = Math.min(MAX_TICKS, Math.floor((hi - first) / step) + 1);
    for (let i = 0; i < n; i++) ticks.push(round2(first + i * step));
  }

  // zone stripe: a thin band hugging the pointer, clipped to the window
  const zoneRects: TapeRect[] = [];
  for (const z of zones) {
    // A zone with a missing/non-finite bound has no extent on the scale. It has
    // to be rejected HERE: `b <= a` below is false for NaN, so an unguarded
    // zone sails past that check and emits y="NaN" height="NaN".
    if (!isFiniteValue(z.from) || !isFiniteValue(z.to)) continue;
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

  let pointer: { path: string; labelX: number; labelY: number };
  if (vertical) {
    const y = round2(height / 2);
    pointer = {
      path: `M${round2(tapeExtent)} ${y}l3 -2.5v5z`, // triangle pointing left into the tape
      // readout centered in the space to the RIGHT of the pointer tip (never over it)
      labelX: round2((tapeExtent + 3 + width) / 2),
      labelY: y,
    };
  } else {
    const x = round2(width / 2);
    pointer = {
      path: `M${x} ${round2(tapeExtent)}l-2.5 3h5z`,
      labelX: x,
      labelY: round2((tapeExtent + 3 + height) / 2),
    };
  }
  // gutter available to the readout = space past the pointer tip
  const gutter = vertical ? round2(width - tapeExtent - 3) : round2(width);
  // A vertical gauge centres the readout on the box midline, so it owns the full
  // height; a horizontal one seats it under the tape column, so it only gets
  // what is left below `tapeExtent + 3` — twice that, because `labelY` centres
  // in the leftover and the glyph box straddles it.
  const band = vertical ? round2(height) : round2(2 * (height - pointer.labelY));

  // Same rule for the spoken zone: only a zone with two finite bounds can
  // contain the value (±Infinity bounds would "contain" everything and put an
  // unbounded range in the summary).
  const containingZone =
    zones.find(
      (z) =>
        isFiniteValue(z.from) &&
        isFiniteValue(z.to) &&
        value >= Math.min(z.from, z.to) &&
        value <= Math.max(z.from, z.to),
    ) ?? null;

  return {
    zoneRects,
    tickPath,
    tickLabels,
    scaleEdge,
    pointer,
    readout: { gutter, band },
    window: [round2(lo), round2(hi)],
    containingZone,
  };
}
