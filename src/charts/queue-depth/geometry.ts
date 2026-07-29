// QueueDepth: Backlog stock vs
// capacity: is the queue draining or growing? A zero-anchored area (the stock).
// a dashed capacity hairline, and above-capacity spans re-stroked in the
// negative ink (shape + color, never color alone). The trend glyph comes from a
// plain linear fit over the last quarter of the window. Coords 2-dp, integer
// viewBox.
import { clamp, maxOf, scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";

type QueueTrend = "up" | "down" | "flat";

interface QueuePoint {
  index: number;
  x: number;
  y: number;
  value: number;
  /** Depth exceeds capacity at this point. */
  above: boolean;
}

export interface QueueDepthGeometry {
  /** Zero-anchored stock area path. */
  area: string;
  /** Full top-edge path (accent, support width). */
  line: string;
  /** Above-capacity spans only (negative, full width; interpolated crossings). */
  breach: string;
  /** y of the capacity hairline (null = no capacity / off-scale). */
  capacityY: number | null;
  /** Slope direction over the last quarter of the window. */
  trend: QueueTrend;
  /** Current depth = last finite value. */
  now: number;
  /** now ÷ capacity when capacity given (2-dp), else null. */
  ratio: number | null;
  /** The current depth is above capacity. */
  breached: boolean;
  /** Per-finite-index positions — overlays + nearest-x. The last entry is the
   *  endpoint (dot + value label). Always ≥ 1 when the geometry is non-null. */
  points: QueuePoint[];
  labelX: number;
  /** Clamped y for the endpoint value label. */
  labelY: number;
  /** Clamped y for the capacity value label (null = no capacity). */
  capLabelY: number | null;
  /** Resolved (zero-anchored) value domain `[min,max]` — the annotation-host y-frame. */
  domain: readonly [number, number];
  /** Top edge of the plot box. */
  y0: number;
  /** Bottom edge of the plot box — where the zero-anchored area lands. */
  y1: number;
}

// least-squares slope of y over consecutive integer x (per-step drift)
function fitSlope(ys: readonly number[]): number {
  const n = ys.length;
  if (n < 2) return 0;
  const xbar = (n - 1) / 2;
  const ybar = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xbar) * (ys[i]! - ybar);
    den += (i - xbar) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

export function queueDepthGeometry(opts: {
  width: number;
  height: number;
  data: readonly Value[];
  capacity?: number | undefined;
  domain?: readonly [number, number] | undefined;
  fontSize?: number | undefined;
}): QueueDepthGeometry | null {
  const { width, height } = opts;
  const pad = 2;
  const fontSize = opts.fontSize ?? 0;

  const n = opts.data.length;
  const finite = opts.data.filter(isFiniteValue);
  if (finite.length === 0) return null;

  // Capacity resolved ONCE, positive-finite: hairline, breach spans, `above`,
  // `breached` and `ratio` all read this, so the announced ceiling is the
  // painted one. Non-finite was already dropped; 0 and negatives were not, and
  // they put every sample "above capacity" — the whole edge re-stroked in the
  // negative ink — while `ratio` (guarded against ÷0) stayed null, so the
  // summary mentioned no capacity at all.
  const capacity = isFiniteValue(opts.capacity) && opts.capacity > 0 ? opts.capacity : null;
  // A fixed domain is honored only as a finite ASCENDING pair. `scaleLinear`
  // maps a non-finite span to its range midpoint, so `[0, NaN]` painted every
  // sample as one flat line at mid-height while the summary went on announcing
  // the real trend off the raw values — announced scale ≠ painted scale. An
  // inverted `[max, min]` flips the encoding instead: a growing backlog paints
  // downward under a ▴ glyph. Both fall back to the documented auto domain.
  const fixed =
    opts.domain &&
    Number.isFinite(opts.domain[0]) &&
    Number.isFinite(opts.domain[1]) &&
    opts.domain[1] > opts.domain[0]
      ? opts.domain
      : null;
  const yMax = fixed ? fixed[1] : Math.max(1, maxOf(finite), capacity ?? 0);
  const yMin = fixed ? fixed[0] : 0; // zero-anchored (stock)

  const xScale = scaleLinear([0, Math.max(1, n - 1)], [pad, width - pad]);
  const yScale = scaleLinear([yMin, yMax], [height - pad, pad]);
  const X = (i: number): number => round2(xScale(i));
  const Y = (v: number): number => round2(clamp(yScale(v), pad, height - pad));

  const by = Y(clamp(0, yMin, yMax)); // baseline

  // Single pass builds the top edge, the zero-anchored area, the per-point list,
  // and the above-capacity breach spans (crossings interpolated at y=cap so the
  // negative re-stroke starts/ends exactly on the hairline). Nulls split every
  // subpath.
  const lineSub: string[] = [];
  const areaSub: string[] = [];
  const breachSub: string[] = [];
  const points: QueuePoint[] = [];
  let run: string[] = [];
  let brk: string[] = [];
  let x0 = 0;
  let xN = 0;
  let prev: { x: number; v: number } | null = null;
  const flushLine = (): void => {
    if (run.length) {
      const top = run.join(" L");
      lineSub.push(`M${top}`);
      areaSub.push(`M${x0} ${by} L${top} L${xN} ${by} Z`);
    }
    run = [];
  };
  const flushBrk = (): void => {
    if (brk.length >= 2) breachSub.push("M" + brk.join(" L"));
    brk = [];
  };
  opts.data.forEach((v, i) => {
    if (!isFiniteValue(v)) {
      flushLine();
      flushBrk();
      prev = null;
      return;
    }
    const x = X(i);
    const y = Y(v);
    if (run.length === 0) x0 = x;
    xN = x;
    run.push(`${x} ${y}`);
    // Strictly ABOVE — one flag drives both the point and its breach span, so
    // the re-stroke can no longer disagree with what the summary announces.
    // `>=` here painted a queue sitting exactly AT capacity (its most common
    // steady state) in full negative ink under a "within capacity" summary, and
    // turned a line that merely touched the hairline into a zero-length span.
    const above = capacity !== null && v > capacity;
    points.push({ index: i, x, y, value: round2(v), above });
    if (capacity !== null) {
      if (prev) {
        const pa = prev.v > capacity;
        if (pa !== above && v !== prev.v) {
          const cx = round2(prev.x + ((capacity - prev.v) / (v - prev.v)) * (x - prev.x));
          const cy = Y(capacity);
          if (pa) {
            brk.push(`${cx} ${cy}`);
            flushBrk();
          } else {
            flushBrk();
            brk.push(`${cx} ${cy}`);
          }
        }
      }
      if (above) brk.push(`${x} ${y}`);
      prev = { x, v };
    }
  });
  flushLine();
  flushBrk();

  // trend over the last quarter of the window (k = 25%, min 2); fitSlope → 0 for n<2
  const k = Math.max(2, Math.ceil(finite.length / 4));
  const slope = fitSlope(finite.slice(finite.length - k));
  const eps = Math.max(1e-9, yMax * 0.005);
  const trend: QueueTrend = slope > eps ? "up" : slope < -eps ? "down" : "flat";

  const now = finite[finite.length - 1]!;
  const capacityY = capacity !== null && capacity >= yMin && capacity <= yMax ? Y(capacity) : null;
  // `dominant-baseline: central` straddles y by half a font EACH way, so the
  // clamp is symmetric. Below `height < fontSize` no clamp exists and the caller
  // drops the readouts rather than painting them past the box.
  const clampY = (y: number): number => round2(clamp(y, fontSize * 0.5, height - fontSize * 0.5));
  const end = points[points.length - 1]!;

  return {
    area: areaSub.join(" "),
    line: lineSub.join(" "),
    breach: breachSub.join(" "),
    capacityY,
    trend,
    now: end.value,
    ratio: capacity !== null ? round2(now / capacity) : null,
    breached: capacity !== null && now > capacity,
    points,
    labelX: round2(width + 3),
    labelY: fontSize > 0 ? clampY(end.y) : end.y,
    capLabelY: capacityY !== null && fontSize > 0 ? clampY(capacityY) : capacityY,
    domain: [yMin, yMax],
    y0: round2(pad),
    y1: round2(height - pad),
  };
}
