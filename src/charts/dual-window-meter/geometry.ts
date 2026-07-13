// DualWindowMeter geometry — pure, React-free. Two
// rolling means of one raw series co-plotted against a compliance target: fast
// window thin, slow window thick. The plotted values are rolling means and the
// window sizes are part of the meaning (stated, never hidden). A trace starts
// where its window fills — no partial-window fake. 2-dp.
import { isFiniteValue, round2, type Value } from "../../core/types.js";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Rolling mean; result[i] is null until the window has filled (leading gap). */
export function rollingMean(data: readonly Value[], w: number): (number | null)[] {
  const out: (number | null)[] = [];
  const win = Math.max(1, Math.floor(w));
  for (let i = 0; i < data.length; i++) {
    if (i < win - 1) {
      out.push(null);
      continue;
    }
    let sum = 0;
    let count = 0;
    for (let j = i - win + 1; j <= i; j++) {
      const v = data[j];
      if (isFiniteValue(v)) {
        sum += v;
        count++;
      }
    }
    out.push(count > 0 ? sum / count : null);
  }
  return out;
}

function lastFinite(arr: readonly (number | null)[]): number | null {
  for (let i = arr.length - 1; i >= 0; i--)
    if (arr[i] != null && Number.isFinite(arr[i]!)) return arr[i]!;
  return null;
}

/** Path from a value array, breaking at nulls (leading gap survives). */
function linePath(
  vals: readonly (number | null)[],
  xOf: (i: number) => number,
  yOf: (v: number) => number,
): string {
  let d = "";
  let pen = false;
  vals.forEach((v, i) => {
    if (v == null || !Number.isFinite(v)) {
      pen = false;
      return;
    }
    d += `${pen ? "L" : "M"}${round2(xOf(i))} ${round2(yOf(v))}`;
    pen = true;
  });
  return d;
}

export function dualWindowGeometry(opts: {
  data: readonly Value[];
  windows: [number, number];
  target: number;
  band: readonly [number, number] | null;
  domain: readonly [number, number] | null;
  width: number;
  height: number;
  gutter: number;
  /** Precomputed rolling means — callers that need this geometry twice (once
   *  to size a label gutter, once for the final layout) pass the same means
   *  in both calls instead of recomputing two O(n·window) passes each time. */
  means?: { fast: readonly (number | null)[]; slow: readonly (number | null)[] } | undefined;
}): {
  fastPath: string;
  slowPath: string;
  targetY: number;
  bandRect: Rect | null;
  fastLast: number | null;
  slowLast: number | null;
  fastLastY: number | null;
  slowLastY: number | null;
  lastX: number;
} {
  const { data, windows, target, band, domain, width, height, gutter } = opts;
  const [wf, ws] = windows;
  const fast = opts.means ? opts.means.fast : rollingMean(data, wf);
  const slow = opts.means ? opts.means.slow : rollingMean(data, ws);

  let lo = Infinity;
  let hi = -Infinity;
  const consider = (v: number | null) => {
    if (v == null || !Number.isFinite(v)) return;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  };
  if (domain) {
    [lo, hi] = domain;
  } else {
    for (const v of fast) consider(v);
    for (const v of slow) consider(v);
    consider(target);
    if (band) {
      consider(band[0]);
      consider(band[1]);
    }
    if (!Number.isFinite(lo)) {
      lo = 0;
      hi = 1;
    }
    if (lo === hi) {
      lo -= 1;
      hi += 1;
    }
  }
  const span = hi - lo || 1;
  const pad = 1;
  const plotW = Math.max(1, width - gutter - pad * 2);
  const n = Math.max(1, data.length - 1);
  const xOf = (i: number): number => pad + (i / n) * plotW;
  const yOf = (v: number): number => pad + (1 - (v - lo) / span) * (height - pad * 2);

  const bandRect: Rect | null = band
    ? {
        x: round2(pad),
        y: round2(yOf(Math.max(band[0], band[1]))),
        width: round2(plotW),
        height: round2(Math.abs(yOf(band[0]) - yOf(band[1]))),
      }
    : null;

  const fastLast = lastFinite(fast);
  const slowLast = lastFinite(slow);
  return {
    fastPath: linePath(fast, xOf, yOf),
    slowPath: linePath(slow, xOf, yOf),
    targetY: round2(yOf(target)),
    bandRect,
    fastLast,
    slowLast,
    fastLastY: fastLast == null ? null : round2(yOf(fastLast)),
    slowLastY: slowLast == null ? null : round2(yOf(slowLast)),
    lastX: round2(xOf(data.length - 1)),
  };
}
