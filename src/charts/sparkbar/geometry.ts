// SparkBar geometry — pure, React-free. Discrete periods as bars,
// anchored at zero. Shares the placement idiom with
// the Sparkline but emits rects, not a path. Win-loss collapses magnitude to a
// three-state win/loss/tie glyph (tie = thin mid-line dash). Coords 2-dp via the kernel.
import { niceDomain, scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";
import { textGutter } from "../../core/labels.js";

export type SparkBarMode = "bar" | "winloss";

/** Endpoint-label metrics, anchored (never measures text — unmeasurable
 *  server-side). fontSize in viewBox units; gutter over-estimates width so the
 *  label never overruns. Kept local to avoid bundling the Sparkline. */
export function labelMetrics(
  text: string,
  width: number,
  height: number,
): { fontSize: number; gutter: number } {
  const fontSize = Math.max(6, Math.min(Math.round(height * 0.5), 11));
  const gutter = Math.min(textGutter(text.length, fontSize, 6), Math.floor(width * 0.45));
  return { fontSize, gutter };
}

/** One placed bar. `sign` drives valence color; `gap` bars (null data) are dropped. */
export interface Bar {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  index: number;
  sign: -1 | 0 | 1;
  last: boolean;
}

export interface SparkBarGeometry {
  bars: Bar[];
  /** y of the zero baseline (bar mode) or the mid-line (win-loss). */
  baselineY: number;
  /** Resolved y-domain (win-loss uses sign space [−1, 1]) — annotations frame. */
  domain: readonly [number, number];
  /** Slot pitch on x (annotations Marker x = data index). */
  slot: number;
  /** Left plot inset. */
  x0: number;
}

export interface SparkBarGeometryOptions {
  width: number;
  height: number;
  mode?: SparkBarMode | undefined;
  domain?: readonly [number, number] | undefined;
  /** Fraction of each slot left empty between bars (0–0.9). */
  gap?: number | undefined;
  pad?: number | undefined;
  /** Reserve plot width on the right for a direct value label, so bars never sit
   *  under it (mirrors the Sparkline). */
  gutterRight?: number | undefined;
}

export function sparkBarGeometry(
  data: readonly Value[],
  opts: SparkBarGeometryOptions,
): SparkBarGeometry {
  const { width, height, mode = "bar", gap = 0.25, pad = 1, gutterRight = 0 } = opts;
  const x0 = pad;
  const y0 = pad;
  const y1 = height - pad;
  const n = data.length;
  const slot = n > 0 ? Math.max(0, width - pad * 2 - gutterRight) / n : 0;
  const barW = round2(Math.max(0.5, slot * (1 - gap)));
  const inset = (slot - barW) / 2;

  // Last finite index → endpoint emphasis.
  let lastFinite = -1;
  for (let i = n - 1; i >= 0; i--) {
    if (isFiniteValue(data[i])) {
      lastFinite = i;
      break;
    }
  }

  if (mode === "winloss") {
    // Equal-height bars above/below a mid-line; magnitude discarded on purpose.
    const mid = round2((y0 + y1) / 2);
    const h = round2((y1 - y0) / 2 - 0.5);
    const bars: Bar[] = [];
    for (let i = 0; i < n; i++) {
      const v = data[i];
      if (!isFiniteValue(v)) continue;
      const sign: -1 | 0 | 1 = v > 0 ? 1 : v < 0 ? -1 : 0;
      const y = sign >= 0 ? mid - h : mid;
      bars.push({
        x: round2(x0 + i * slot + inset),
        y: sign === 0 ? round2(mid - 0.5) : y,
        width: barW,
        height: sign === 0 ? 1 : h,
        value: v,
        index: i,
        sign,
        last: i === lastFinite,
      });
    }
    return { bars, baselineY: mid, domain: [-1, 1], slot, x0 };
  }

  const domain = opts.domain ?? niceDomain(data, true);
  const yScale = scaleLinear(domain, [y1, y0]);
  const baselineY = round2(yScale(Math.min(Math.max(0, domain[0]), domain[1])));

  const bars: Bar[] = [];
  for (let i = 0; i < n; i++) {
    const v = data[i];
    if (!isFiniteValue(v)) continue;
    const top = yScale(v);
    const h = Math.max(0.5, Math.abs(top - baselineY));
    // Clamp into the plot: a ~zero bar sitting on a floor baseline would push
    // its min-height below y1, so nudge it back inside rather than overflow.
    let y = Math.min(top, baselineY);
    if (y + h > y1) y = y1 - h;
    if (y < y0) y = y0;
    bars.push({
      x: round2(x0 + i * slot + inset),
      y: round2(y),
      width: barW,
      height: round2(h),
      value: v,
      index: i,
      sign: v > 0 ? 1 : v < 0 ? -1 : 0,
      last: i === lastFinite,
    });
  }
  return { bars, baselineY, domain, slot, x0 };
}
