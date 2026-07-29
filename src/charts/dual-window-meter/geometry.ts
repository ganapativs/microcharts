// DualWindowMeter: Two
// rolling means of one raw series co-plotted against a compliance target: fast
// window thin, slow window thick. The plotted values are rolling means and the
// window sizes are part of the meaning (stated, never hidden). A trace starts
// where its window fills — no partial-window fake. 2-dp.
import { lastFinite } from "../../core/stats.js";
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
    // A window of finite samples can still overflow (1e308 × 3 → Infinity). An
    // unplottable mean is a gap, exactly like an unfilled window — otherwise the
    // readout and the live region announce "∞" beside a normal-looking trace.
    const mean = count > 0 ? sum / count : null;
    out.push(mean != null && Number.isFinite(mean) ? mean : null);
  }
  return out;
}

/** Path from a value array, breaking wherever `at` has no y (leading gap survives). */
function linePath(
  vals: readonly (number | null)[],
  xOf: (i: number) => number,
  at: (v: number) => number | null,
): string {
  let d = "";
  let pen = false;
  vals.forEach((v, i) => {
    const y = v == null ? null : at(v);
    if (y == null) {
      pen = false;
      return;
    }
    d += `${pen ? "L" : "M"}${round2(xOf(i))} ${y}`;
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
  /** null when `target` is not a finite number — nothing to draw the line at. */
  targetY: number | null;
  bandRect: Rect | null;
  fastLast: number | null;
  slowLast: number | null;
  fastLastY: number | null;
  slowLastY: number | null;
  lastX: number;
  /** Plot-box floor — the padded bottom edge both traces are scaled into. */
  y1: number;
} {
  const { data, windows, target, band, domain, width, height, gutter } = opts;
  const [wf, ws] = windows;
  const fast = opts.means ? opts.means.fast : rollingMean(data, wf);
  const slow = opts.means ? opts.means.slow : rollingMean(data, ws);

  // Hostile CONFIG, not hostile data: a host computes these three from an empty
  // input field or a `Math.min` over a dirty series and hands over NaN/±Infinity.
  // Each used to reach markup on a chart that still looked normal — a target
  // line at y1="NaN", every trace point at y="NaN" (an out-of-range domain
  // makes `(v - lo) / span` non-finite), a corridor of NaN height. Resolve once,
  // here, so the announced scale and the painted scale are the same scale.
  const hasTarget = isFiniteValue(target);
  const dom = domain && isFiniteValue(domain[0]) && isFiniteValue(domain[1]) ? domain : null;
  // A half-finite corridor is dropped whole rather than half-painted: its finite
  // edge must not stretch the domain for a band nobody can see.
  const zone = band && isFiniteValue(band[0]) && isFiniteValue(band[1]) ? band : null;

  let lo = Infinity;
  let hi = -Infinity;
  const consider = (v: number | null) => {
    if (v == null || !Number.isFinite(v)) return;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  };
  if (dom) {
    [lo, hi] = dom;
  } else {
    for (const v of fast) consider(v);
    for (const v of slow) consider(v);
    consider(target);
    if (zone) {
      consider(zone[0]);
      consider(zone[1]);
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
  // A y that isn't representable is no y at all — the mark drops instead of
  // landing at NaN. A domain can be finite and still overflow the subtraction
  // (1e308 − −1e308 → Infinity, and Infinity/Infinity is NaN), the same failure
  // `scaleLinear` guards centrally for the charts that use it.
  const at = (v: number): number | null => {
    const y = round2(yOf(v));
    return Number.isFinite(y) ? y : null;
  };

  const zoneTop = zone ? at(Math.max(zone[0], zone[1])) : null;
  const zoneBottom = zone ? at(Math.min(zone[0], zone[1])) : null;
  const bandRect: Rect | null =
    zoneTop == null || zoneBottom == null
      ? null
      : {
          x: round2(pad),
          y: zoneTop,
          width: round2(plotW),
          height: round2(Math.abs(zoneBottom - zoneTop)),
        };

  const fastLast = lastFinite(fast) ?? null;
  const slowLast = lastFinite(slow) ?? null;
  return {
    fastPath: linePath(fast, xOf, at),
    slowPath: linePath(slow, xOf, at),
    targetY: hasTarget ? at(target) : null,
    bandRect,
    fastLast,
    slowLast,
    fastLastY: fastLast == null ? null : at(fastLast),
    slowLastY: slowLast == null ? null : at(slowLast),
    lastX: round2(xOf(data.length - 1)),
    y1: round2(height - pad),
  };
}
