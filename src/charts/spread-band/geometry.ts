// SpreadBand geometry — pure, React-free. Which of two series leads,
// by how much, since when: subject (a) and reference (b) on ONE shared domain,
// with the SIGNED gap between them filled and split at interpolated crossings.
// A null in either series is a gap in BOTH (the gap is undefined there), so the
// two lines share one gap mask. No dual axes, no per-series normalization. 2-dp.
import { clamp, extent, scaleLinear } from "../../core/scale.js";
import { linePath } from "../../core/path.js";
import { isFiniteValue, round2, type Value, type XY } from "../../core/types.js";

/** One paired reading: `a` = the subject, `b` = the reference it is judged against. */
export interface SpreadDatum {
  a: Value;
  b: Value;
}

/** Endpoint (last present) signed gap `a − b`, or null when no pair is present.
 *  Both entries need this to reserve the gutter before geometry runs. */
export function lastGap(data: readonly SpreadDatum[]): number | null {
  for (let i = data.length - 1; i >= 0; i--) {
    const d = data[i];
    if (d && isFiniteValue(d.a) && isFiniteValue(d.b)) return d.a - d.b;
  }
  return null;
}

/** Gutter label size (viewBox units) — dense-strip weight, floored legible. */
export function gutterFont(height: number): number {
  return clamp(Math.round(height * 0.4), 5, 8);
}

export interface SpreadBandGeometry {
  /** Subject line (a) — the loud mark. */
  subjectD: string;
  /** Reference line (b) — the quiet mark. */
  referenceD: string;
  /** Filled regions where a > b (one `<path>`, many subpaths). */
  aLeadBand: string;
  /** Filled regions where a < b. */
  bLeadBand: string;
  subjectPoints: (XY | null)[];
  referencePoints: (XY | null)[];
  /** Interpolated a=b crossing points (dots). */
  crossings: XY[];
  /** Right-hand index (0-based) of the last sign flip, or null if none. */
  lastFlip: number | null;
  /** Last present pair — anchors the endpoint dots, gap label, leader read. */
  last: { x: number; ya: number; yb: number; a: number; b: number; index: number } | null;
  /** True when every present pair has a === b (identical series → one line). */
  coincident: boolean;
  plot: { x0: number; x1: number; y0: number; y1: number };
}

export function spreadBandGeometry(opts: {
  width: number;
  height: number;
  data: readonly SpreadDatum[];
  domain?: readonly [number, number] | undefined;
  gutterCh: number;
  fontSize: number;
}): SpreadBandGeometry {
  const { width, height, data, gutterCh, fontSize } = opts;
  const pad = 2;
  const gutter = gutterCh > 0 ? Math.ceil(gutterCh * fontSize * 0.62) + 4 : 0;
  const x0 = pad;
  const x1 = width - pad - gutter;
  const y0 = pad;
  const y1 = height - pad;
  const n = data.length;

  // null in either series → gap in both: one shared present-mask
  const pairs: ({ a: number; b: number } | null)[] = data.map((d) =>
    d && isFiniteValue(d.a) && isFiniteValue(d.b) ? { a: d.a, b: d.b } : null,
  );

  const flat: number[] = [];
  for (const p of pairs) {
    if (p) {
      flat.push(p.a, p.b);
    }
  }
  let domain =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? opts.domain
      : (extent(flat) ?? [0, 1]);
  if (domain[0] === domain[1]) domain = [domain[0] - 1, domain[1] + 1];
  const yScale = scaleLinear(domain, [y1, y0]);
  const xFor = (i: number): number => (n > 1 ? x0 + (i * (x1 - x0)) / (n - 1) : (x0 + x1) / 2);
  const yFor = (v: number): number => round2(clamp(yScale(v), y0, y1));

  const subjectPoints: (XY | null)[] = pairs.map((p, i) =>
    p ? ([round2(xFor(i)), yFor(p.a)] as const) : null,
  );
  const referencePoints: (XY | null)[] = pairs.map((p, i) =>
    p ? ([round2(xFor(i)), yFor(p.b)] as const) : null,
  );

  const aLead: string[] = [];
  const bLead: string[] = [];
  const crossings: XY[] = [];
  let lastFlip: number | null = null;
  const push = (sign: number, poly: string): void => {
    if (sign > 0) aLead.push(poly);
    else if (sign < 0) bLead.push(poly);
  };

  for (let i = 0; i < n - 1; i++) {
    const p = pairs[i];
    const q = pairs[i + 1];
    if (!p || !q) continue;
    const xi = round2(xFor(i));
    const xj = round2(xFor(i + 1));
    const yai = yFor(p.a);
    const ybi = yFor(p.b);
    const yaj = yFor(q.a);
    const ybj = yFor(q.b);
    const di = p.a - p.b;
    const dj = q.a - q.b;
    if (di === 0 && dj === 0) continue; // the two lines coincide across this step
    const straddles = (di > 0 && dj < 0) || (di < 0 && dj > 0);
    if (!straddles) {
      const sign = di > 0 || dj > 0 ? 1 : -1;
      push(sign, `M${xi} ${yai} L${xj} ${yaj} L${xj} ${ybj} L${xi} ${ybi} Z`);
    } else {
      const t = di / (di - dj); // fraction along the step to a=b
      const xc = round2(xi + t * (xj - xi));
      const yc = yFor(p.a + t * (q.a - p.a));
      crossings.push([xc, yc] as const);
      lastFlip = i + 1;
      push(di > 0 ? 1 : -1, `M${xi} ${yai} L${xc} ${yc} L${xi} ${ybi} Z`);
      push(dj > 0 ? 1 : -1, `M${xc} ${yc} L${xj} ${yaj} L${xj} ${ybj} Z`);
    }
  }

  let last: SpreadBandGeometry["last"] = null;
  for (let i = n - 1; i >= 0; i--) {
    const p = pairs[i];
    if (p) {
      last = { x: round2(xFor(i)), ya: yFor(p.a), yb: yFor(p.b), a: p.a, b: p.b, index: i };
      break;
    }
  }

  const present = pairs.filter((p): p is { a: number; b: number } => p !== null);
  const coincident = present.length > 0 && present.every((p) => p.a === p.b);

  return {
    subjectD: linePath(subjectPoints),
    referenceD: linePath(referencePoints),
    aLeadBand: aLead.join(" "),
    bLeadBand: bLead.join(" "),
    subjectPoints,
    referencePoints,
    crossings,
    lastFlip,
    last,
    coincident,
    plot: { x0, x1, y0, y1 },
  };
}
