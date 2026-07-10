// QueueDepth geometry — pure, React-free (plan/26 §5). Backlog stock vs
// capacity: is the queue draining or growing? A zero-anchored area (the stock),
// a dashed capacity hairline, and above-capacity spans re-stroked in the
// negative ink (shape + color, never color alone). The trend glyph comes from a
// plain linear fit over the last quarter of the window. Coords 2-dp, integer
// viewBox.
import { clamp, scaleLinear } from "../../core/scale.js";
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

  const capacity = isFiniteValue(opts.capacity) ? opts.capacity : null;
  const yMax = opts.domain?.[1] ?? Math.max(1, Math.max(...finite), capacity ?? 0);
  const yMin = opts.domain?.[0] ?? 0; // zero-anchored (stock)

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
    points.push({ index: i, x, y, value: round2(v), above: capacity !== null && v > capacity });
    if (capacity !== null) {
      if (prev) {
        const pa = prev.v >= capacity;
        if (pa !== v >= capacity && v !== prev.v) {
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
      if (v >= capacity) brk.push(`${x} ${y}`);
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
  const clampY = (y: number): number => round2(clamp(y, fontSize * 0.7, height - fontSize * 0.3));
  const end = points[points.length - 1]!;

  return {
    area: areaSub.join(" "),
    line: lineSub.join(" "),
    breach: breachSub.join(" "),
    capacityY,
    trend,
    now: end.value,
    ratio: capacity !== null && capacity > 0 ? round2(now / capacity) : null,
    breached: capacity !== null && now > capacity,
    points,
    labelX: round2(width + 3),
    labelY: fontSize > 0 ? clampY(end.y) : end.y,
    capLabelY: capacityY !== null && fontSize > 0 ? clampY(capacityY) : capacityY,
  };
}
