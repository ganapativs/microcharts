// Constellation geometry — pure, React-free (plan/24 #16, S1 points). Sparse
// events on a time axis: x = time (sacred, never jittered), y = value, optional
// magnitude → area-true dot size (r ∝ √m). When no point carries a value, the
// vertical position is deterministic seeded jitter (core/jitter) that ENCODES
// NOTHING — the connector's slope is then meaningless, and the summary never
// mentions vertical position. Two-layer render: one connector polyline (time
// order) + one <circle> per event. All coords 2-dp.
import { clamp, extent, scaleLinear } from "../../core/scale.js";
import { jitter } from "../../core/jitter.js";
import { round2 } from "../../core/types.js";

interface ConstellationStar {
  cx: number;
  cy: number;
  r: number;
  /** Original index into the input array. */
  index: number;
  /** Source time value (for interactive labels / chronological stepping). */
  x: number;
  /** Source value (NaN when the point had no y — jittered layout). */
  value: number;
  /** Source magnitude (NaN when absent). */
  m: number;
}

export interface ConstellationGeometry {
  stars: ConstellationStar[];
  /** Polyline through the events in time order, or null (n < 2 / connect off). */
  connectorPath: string | null;
  /** True when vertical position is seeded jitter (no y supplied) — layout, not data. */
  jittered: boolean;
  /** Index of the largest event (max magnitude, else max value, else -1). */
  largestIndex: number;
  width: number;
  height: number;
}

/** Radius floor so a logged event never fully vanishes (near-zero magnitude). */
const R_MIN = 0.5;

export function constellationGeometry(opts: {
  points: readonly { x: number; y?: number | undefined; m?: number | undefined }[];
  width: number;
  height: number;
  domain?: readonly [number, number] | undefined;
  xDomain?: readonly [number, number] | undefined;
  connect: boolean;
  rBase: number;
  pad: number;
}): ConstellationGeometry {
  const { width, height, connect, rBase, pad } = opts;

  // Finite-x only; time is required. Keep the original index for stable naming.
  const items = opts.points
    .map((p, index) => ({
      index,
      x: p.x,
      y: typeof p.y === "number" ? p.y : NaN,
      m: typeof p.m === "number" ? p.m : NaN,
    }))
    .filter((p) => Number.isFinite(p.x));

  const empty: ConstellationGeometry = {
    stars: [],
    connectorPath: null,
    jittered: false,
    largestIndex: -1,
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
  if (items.length === 0) return empty;

  const hasY = items.some((p) => Number.isFinite(p.y));
  const jittered = !hasY;

  // Magnitude → area-true radius. mMax over finite magnitudes.
  const mags = items.map((p) => p.m).filter((m) => Number.isFinite(m) && m > 0);
  const mMax = mags.length ? Math.max(...mags) : 0;
  const radiusOf = (m: number): number => {
    if (!Number.isFinite(m) || mMax <= 0) return rBase;
    return Math.max(R_MIN, round2(rBase * Math.sqrt(clamp(m / mMax, 0, 1))));
  };
  const maxR = Math.max(rBase, ...items.map((p) => radiusOf(p.m)));

  // X scale — time. Collapsed extent centers the run.
  let xd =
    opts.xDomain && opts.xDomain.every((d) => Number.isFinite(d))
      ? (opts.xDomain as [number, number])
      : (extent(items.map((p) => p.x)) ?? [0, 1]);
  if (xd[0] === xd[1]) xd = [xd[0] - 1, xd[1] + 1];
  const sx = scaleLinear(xd, [pad + maxR, width - pad - maxR]);

  const midY = round2(height / 2);
  const stars: ConstellationStar[] = [];

  if (hasY) {
    // Value on the vertical axis, zero-anchored only if the caller says so via
    // domain; default is the data extent (these are sparse point events).
    const ys = items.map((p) => p.y).filter((y) => Number.isFinite(y));
    let yd =
      opts.domain && opts.domain.every((d) => Number.isFinite(d))
        ? (opts.domain as [number, number])
        : (extent(ys) ?? [0, 1]);
    if (yd[0] === yd[1]) yd = [yd[0] - 1, yd[1] + 1];
    const sy = scaleLinear(yd, [height - pad - maxR, pad + maxR]);
    for (const p of items) {
      if (!Number.isFinite(p.y)) continue; // in value mode a point needs a value
      stars.push({
        cx: round2(sx(p.x)),
        cy: round2(sy(p.y)),
        r: radiusOf(p.m),
        index: p.index,
        x: p.x,
        value: p.y,
        m: p.m,
      });
    }
  } else {
    // No values → seeded vertical jitter (layout only, encodes nothing). Seed
    // from the data so SSR/hydration/visual runs are byte-identical.
    const amp = Math.max(0, height / 2 - pad - maxR) * 0.8;
    const seedParts = items.flatMap((p) => [p.x, Number.isFinite(p.m) ? p.m : 0]);
    const offsets = jitter(seedParts, items.length, amp);
    items.forEach((p, i) => {
      stars.push({
        cx: round2(sx(p.x)),
        cy: round2(clamp(midY + (offsets[i] ?? 0), pad + maxR, height - pad - maxR)),
        r: radiusOf(p.m),
        index: p.index,
        x: p.x,
        value: NaN,
        m: p.m,
      });
    });
  }

  // Largest event: max magnitude, else max value, else the last in time.
  let largestIndex = -1;
  if (stars.length) {
    if (mMax > 0) {
      let best = -Infinity;
      for (const s of stars)
        if (Number.isFinite(s.m) && s.m > best) {
          best = s.m;
          largestIndex = s.index;
        }
    } else if (hasY) {
      let best = -Infinity;
      for (const s of stars)
        if (Number.isFinite(s.value) && s.value > best) {
          best = s.value;
          largestIndex = s.index;
        }
    }
  }

  // Connector: polyline through the stars in TIME order (never x-jittered).
  let connectorPath: string | null = null;
  if (connect && stars.length >= 2) {
    const ordered = [...stars].sort((a, b) => a.x - b.x);
    connectorPath = ordered.map((s, i) => `${i === 0 ? "M" : "L"}${s.cx} ${s.cy}`).join("");
  }

  return {
    stars,
    connectorPath,
    jittered,
    largestIndex,
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
}
