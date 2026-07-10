// MinimapStrip geometry — pure, React-free (plan/25 §10, plan/17 F10). Content
// thumbnail + viewport window + annotation-tick lane, plus fog-of-war over
// UNKNOWN regions (absence ≠ zero). The window maps linearly to the domain (no
// fisheye); the unknown share is disclosed in the summary. 2-dp.
import { maxPerBucket } from "../../core/downsample.js";
import { clamp } from "../../core/scale.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MinimapInput {
  content: readonly Value[];
  window: [number, number];
  marks?: readonly number[] | undefined;
  known?: readonly [number, number][] | undefined;
}

export interface ContentBucket {
  x: number;
  width: number;
  height: number;
  /** Normalized 0–1 (for the heat variant opacity). */
  norm: number;
}

/** Default domain spans content indices + every window / mark / known extent. */
export function minimapDomain(data: MinimapInput): [number, number] {
  let lo = 0;
  let hi = data.content.length;
  const consider = (v: number) => {
    if (!Number.isFinite(v)) return;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  };
  consider(data.window[0]);
  consider(data.window[1]);
  for (const m of data.marks ?? []) consider(m);
  for (const [a, b] of data.known ?? []) {
    consider(a);
    consider(b);
  }
  return [lo, hi === lo ? lo + 1 : hi];
}

export function minimapGeometry(opts: {
  content: readonly Value[];
  window: [number, number];
  marks: readonly number[];
  known: readonly [number, number][];
  domain: readonly [number, number];
  width: number;
  height: number;
}): {
  buckets: ContentBucket[];
  windowRect: Rect;
  fogRects: Rect[];
  markX: number[];
  unknownShare: number;
} {
  const { content, window: win, marks, known, domain, width, height } = opts;
  const [d0, d1] = domain;
  const span = d1 - d0 || 1;
  const inset = 1;
  const laneH = 2; // top annotation lane
  const contentTop = inset + laneH;
  const contentH = height - contentTop - inset;
  const xOf = (v: number): number =>
    round2(inset + ((clamp(v, d0, d1) - d0) / span) * (width - inset * 2));

  // content buckets (max-per-bucket downsample)
  const nb = Math.max(1, Math.min(Math.floor((width - inset * 2) / 2), content.length || 1));
  const vals = maxPerBucket(content, nb, { abs: true });
  let maxV = 0;
  for (const v of vals) if (v != null && Math.abs(v) > maxV) maxV = Math.abs(v);
  const bucketW = (width - inset * 2) / Math.max(1, vals.length);
  const buckets: ContentBucket[] = vals.map((v, i) => {
    const norm = maxV > 0 && v != null ? Math.abs(v) / maxV : 0;
    const h = round2(norm * contentH);
    return {
      x: round2(inset + i * bucketW),
      width: round2(Math.max(0.4, bucketW - 0.3)),
      height: h,
      norm: round2(norm),
    };
  });

  const windowRect: Rect = {
    x: xOf(win[0]),
    y: round2(inset - 0.5),
    width: round2(Math.max(1, xOf(win[1]) - xOf(win[0]))),
    height: round2(height - inset + 0.5),
  };

  // fog = complement of known within the domain
  const knownDom = known.length > 0 ? known : [domain];
  const sorted = [...knownDom]
    .map(([a, b]) => [Math.min(a, b), Math.max(a, b)] as [number, number])
    .sort((p, q) => p[0] - q[0]);
  const fogRects: Rect[] = [];
  let coveredSpan = 0;
  let cursor = d0;
  for (const [a, b] of sorted) {
    const lo = Math.max(d0, a);
    const hi = Math.min(d1, b);
    if (lo > cursor) {
      fogRects.push({
        x: xOf(cursor),
        y: contentTop,
        width: round2(xOf(lo) - xOf(cursor)),
        height: round2(contentH),
      });
    }
    if (hi > cursor) coveredSpan += hi - Math.max(cursor, lo);
    cursor = Math.max(cursor, hi);
  }
  if (cursor < d1) {
    fogRects.push({
      x: xOf(cursor),
      y: contentTop,
      width: round2(xOf(d1) - xOf(cursor)),
      height: round2(contentH),
    });
  }
  const unknownShare = round2(Math.max(0, Math.min(1, 1 - coveredSpan / span)));

  const markX = marks.filter(isFiniteValue).map(xOf);

  return { buckets, windowRect, fogRects, markX, unknownShare };
}

/** Diagonal-hatch path across a rect (fog-of-war texture; unknown ≠ zero). */
export function hatchPath(r: Rect, step = 2.5): string {
  let d = "";
  const x2 = r.x + r.width;
  const yTop = r.y;
  const yBot = r.y + r.height;
  for (let x = r.x - r.height; x < x2; x += step) {
    const ax = Math.max(r.x, x);
    const ay = yBot - (ax - x);
    const bx = Math.min(x2, x + r.height);
    const by = yBot - (bx - x);
    if (ay < yTop || by < yTop) continue;
    d += `M${round2(ax)} ${round2(ay)}L${round2(bx)} ${round2(by)}`;
  }
  return d;
}
