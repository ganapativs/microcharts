// EnsembleGhosts: What could happen,
// across the simulated futures? A faint bundle of member paths + one emphasized
// representative — because a mean line hides that futures disagree in SHAPE, not
// just endpoint. Ghost SELECTION is deterministic (endpoint-rank quantiles, no
// Math.random, no jitter) so the same input renders identically every time.
// Coords 2-dp, integer viewBox.
import { round2, isFiniteValue } from "../../core/types.js";
import { clamp, maxOf, minOf } from "../../core/scale.js";

/** Frame inset the paths are scaled into — shared with the static entry's seat. */
export const PAD = 2;

const cleanMember = (m: readonly number[]): boolean => m.length > 0 && m.every(isFiniteValue);

/**
 * Deterministically pick `k` member indices: rank members by endpoint value,
 * then take evenly spaced quantiles of that ranking. Same input → same ghosts.
 */
export function selectGhosts(series: readonly (readonly number[])[], k: number): number[] {
  const valid = series
    .map((m, i) => ({ i, end: m[m.length - 1]! }))
    .filter((r) => cleanMember(series[r.i]!));
  const n = valid.length;
  if (k >= n) return valid.map((r) => r.i);
  const ranked = valid.sort((a, b) => a.end - b.end || a.i - b.i);
  const out: number[] = [];
  for (let j = 0; j < k; j++) {
    const rank = k === 1 ? Math.floor((n - 1) / 2) : Math.round((j / (k - 1)) * (n - 1));
    out.push(ranked[rank]!.i);
  }
  return [...new Set(out)];
}

export interface EnsembleGeometry {
  ghostPaths: { d: string; member: number }[];
  /** member: null ⇒ the emphasised path is the synthetic pointwise median. */
  emphasisPath: { d: string; member: number | null };
  /** Endpoint dots for the ghosts (rendered only when `endpoints`). */
  ghostEnds: { x: number; y: number }[];
  /** Endpoint range across ALL valid members. */
  spread: { lastLo: number; lastHi: number };
  /** Endpoint of the emphasised ("typical") path — for the summary. */
  typicalEnd: number;
  memberCount: number;
  /** Endpoint of the emphasised path, in viewBox coords (label anchor). */
  landing: { x: number; y: number; value: number };
  /** x for a member's Nth point on the shared index scale (annotations Marker). */
  xFor: (i: number) => number;
  /** y for a data value on the shared domain (annotations Threshold/TargetZone). */
  yFor: (v: number) => number;
  /** Resolved value domain `[min,max]` — the annotation-host y-frame. */
  domain: readonly [number, number];
  labelX: number;
  labelY: number;
  totalWidth: number;
}

export function ensembleGeometry(opts: {
  width: number;
  height: number;
  data: readonly (readonly number[])[];
  ghosts?: number | undefined;
  emphasis?: "nearest-median" | "median" | number | undefined;
  domain?: readonly [number, number] | undefined;
  pad?: number | undefined;
  /** Chars in the reserved right-hand label gutter (0 = none). */
  gutterCh?: number | undefined;
  fontSize?: number | undefined;
}): EnsembleGeometry | null {
  const { width, height, data } = opts;
  const validIdx = data.map((_, i) => i).filter((i) => cleanMember(data[i]!));
  if (validIdx.length === 0) return null;

  const pad = opts.pad ?? PAD;
  const gutterCh = opts.gutterCh ?? 0;
  const fontSize = opts.fontSize ?? 0;
  const gutter = gutterCh > 0 ? Math.ceil(gutterCh * fontSize * 0.72) + 4 : 0;
  const maxLen = maxOf(validIdx.map((i) => data[i]!.length));

  // inlined min/max (avoids pulling extent into this entry)
  let lo = Infinity;
  let hi = -Infinity;
  for (const i of validIdx)
    for (const v of data[i]!) {
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  const [d0, d1] = opts.domain ?? [lo, hi];
  const plotH = height - 2 * pad;
  const plotW = width - 2 * pad;
  const lastX = Math.max(1, maxLen - 1);
  const sx = (i: number): number => round2(pad + (i / lastX) * plotW);
  const sy = (v: number): number =>
    round2(d1 === d0 ? height / 2 : height - pad - ((v - d0) / (d1 - d0)) * plotH);
  const pathOf = (m: readonly number[]): string =>
    m.map((v, i) => `${i ? "L" : "M"}${sx(i)} ${sy(v)}`).join(" ");

  const k = Math.max(1, Math.min(12, Math.round(opts.ghosts ?? 8)));
  const picked = selectGhosts(data, k);
  const ghostPaths = picked.map((member) => ({ d: pathOf(data[member]!), member }));

  // pointwise median vector over the shared index range (inline per-index median)
  const median: number[] = [];
  for (let i = 0; i < maxLen; i++) {
    const col = validIdx.map((m) => data[m]![i]).filter(isFiniteValue) as number[];
    if (col.length === 0) {
      median.push(NaN);
      continue;
    }
    col.sort((a, b) => a - b);
    const mid = col.length >> 1;
    median.push(col.length % 2 ? col[mid]! : (col[mid - 1]! + col[mid]!) / 2);
  }

  const emphasis = opts.emphasis ?? "nearest-median";
  let emphasisPath: { d: string; member: number | null };
  if (emphasis === "median") {
    emphasisPath = { d: pathOf(median.map((v) => (Number.isFinite(v) ? v : d0))), member: null };
  } else if (typeof emphasis === "number") {
    const m = validIdx.includes(emphasis) ? emphasis : validIdx[0]!;
    emphasisPath = { d: pathOf(data[m]!), member: m };
  } else {
    // nearest-median: the real member with the smallest L2 distance to the median
    let best = validIdx[0]!;
    let bestD = Infinity;
    for (const m of validIdx) {
      let dist = 0;
      const mm = data[m]!;
      for (let i = 0; i < mm.length; i++)
        if (Number.isFinite(median[i])) dist += (mm[i]! - median[i]!) ** 2;
      if (dist < bestD) {
        bestD = dist;
        best = m;
      }
    }
    emphasisPath = { d: pathOf(data[best]!), member: best };
  }

  const ends = validIdx.map((i) => data[i]![data[i]!.length - 1]!);
  const emphMember = emphasisPath.member;
  const typicalEnd =
    emphMember !== null
      ? data[emphMember]![data[emphMember]!.length - 1]!
      : (median[maxLen - 1] ?? median[median.length - 1]!);

  const ghostEnds = picked.map((m) => ({
    x: sx(data[m]!.length - 1),
    y: sy(data[m]![data[m]!.length - 1]!),
  }));

  const resolvedTypicalEnd = Number.isFinite(typicalEnd) ? typicalEnd : ends[0]!;
  const landingX = emphMember !== null ? sx(data[emphMember]!.length - 1) : sx(maxLen - 1);

  return {
    ghostPaths,
    emphasisPath,
    ghostEnds,
    spread: { lastLo: minOf(ends), lastHi: maxOf(ends) },
    typicalEnd: resolvedTypicalEnd,
    memberCount: validIdx.length,
    landing: { x: landingX, y: sy(resolvedTypicalEnd), value: resolvedTypicalEnd },
    xFor: sx,
    yFor: sy,
    domain: [d0, d1],
    labelX: round2(width + 3),
    labelY:
      fontSize > 0
        ? round2(clamp(sy(resolvedTypicalEnd), fontSize * 0.5, height - fontSize * 0.5))
        : sy(resolvedTypicalEnd),
    totalWidth: width + gutter,
  };
}

/** Right-gutter box for an endpoint readout — paths ignore gutter, so call after geometry. */
export function ensembleEndLabel(
  width: number,
  height: number,
  landingY: number,
  text: string,
  fontSize: number,
): { totalWidth: number; labelX: number; labelY: number } {
  if (!text || fontSize <= 0) return { totalWidth: width, labelX: width + 3, labelY: landingY };
  const gutter = Math.ceil(text.length * fontSize * 0.72) + 4;
  return {
    totalWidth: width + gutter,
    labelX: width + 3,
    labelY: round2(clamp(landingY, fontSize * 0.5, height - fontSize * 0.5)),
  };
}
