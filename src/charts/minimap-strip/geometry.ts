// MinimapStrip: Content
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
  /** Normalized 0–1 (for the heat mode opacity). */
  norm: number;
}

/** The viewport window as a usable pair, or null when it is not measurable
 *  (missing, short, null or non-finite endpoint). A window with no position is
 *  not a window at 0 — every caller must branch on it rather than plot it. */
export function minimapWindow(win: MinimapInput["window"] | undefined): [number, number] | null {
  const a = win?.[0];
  const b = win?.[1];
  if (!isFiniteValue(a) || !isFiniteValue(b)) return null;
  return a <= b ? [a, b] : [b, a];
}

/** Both known extents real, or the pair is dropped — a half-known extent can't
 *  say where knowledge ends, and a null one is not a region at 0. */
function knownPairs(known: readonly (readonly [number, number])[]): [number, number][] {
  const out: [number, number][] = [];
  for (const k of known) {
    const a = k?.[0];
    const b = k?.[1];
    if (isFiniteValue(a) && isFiniteValue(b)) out.push([Math.min(a, b), Math.max(a, b)]);
  }
  return out;
}

/** Default domain spans content indices + every window / mark / known extent.
 *  A caller-supplied `prop` wins, but only when it is a real, non-empty span. */
export function minimapDomain(
  data: MinimapInput,
  prop?: readonly number[] | undefined,
): [number, number] {
  const p0 = prop?.[0];
  const p1 = prop?.[1];
  if (isFiniteValue(p0) && isFiniteValue(p1) && p0 !== p1) return p0 < p1 ? [p0, p1] : [p1, p0];
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
  window: MinimapInput["window"];
  marks: readonly number[];
  known: readonly [number, number][];
  domain: readonly [number, number];
  width: number;
  height: number;
}): {
  buckets: ContentBucket[];
  windowRect: Rect;
  /** False when the window was not measurable: the rect spans the whole domain
   *  and must be drawn as an empty frame, never as "all of it is in view". */
  windowKnown: boolean;
  fogRects: Rect[];
  markX: number[];
  unknownShare: number;
  /** Bottom of the top annotation lane = top of the content band. Lane ticks
   *  fill 0.5→contentTop; content and fog sit below it. */
  contentTop: number;
  /** Bottom of the content band; overlay-mode ticks reach it. */
  contentBottom: number;
} {
  const { content, window: win, marks, known, domain, width, height } = opts;
  const [d0, d1] = domain;
  const span = d1 - d0 || 1;
  const inset = 1;
  // Top annotation lane scales with height so lane-mode ticks stay legible
  // (a fixed 2u lane vanishes on taller strips), clamped so it never dominates.
  const laneH = Math.max(2, Math.min(6, round2(height * 0.22)));
  const contentTop = inset + laneH;
  const contentH = height - contentTop - inset;
  const xOf = (v: number): number =>
    round2(inset + ((clamp(v, d0, d1) - d0) / span) * (width - inset * 2));

  const nb = Math.max(1, Math.min(Math.floor((width - inset * 2) / 2), content.length || 1));
  const vals = maxPerBucket(content, nb, { abs: true });
  let maxV = 0;
  for (const v of vals) if (isFiniteValue(v) && Math.abs(v) > maxV) maxV = Math.abs(v);
  const bucketW = (width - inset * 2) / Math.max(1, vals.length);
  const buckets: ContentBucket[] = vals.map((v, i) => {
    const norm = maxV > 0 && isFiniteValue(v) ? Math.abs(v) / maxV : 0;
    const h = round2(norm * contentH);
    return {
      x: round2(inset + i * bucketW),
      width: round2(Math.max(0.4, bucketW - 0.3)),
      height: h,
      norm: round2(norm),
    };
  });

  // An unmeasurable window has no place on the strip; the rect degrades to the
  // full domain so the rail still reads as a frame (empty ≠ a window at zero),
  // and `windowKnown` tells the caller to draw it hollow.
  const winPair = minimapWindow(win);
  const [w0, w1] = winPair ?? [d0, d1];
  const windowRect: Rect = {
    x: xOf(w0),
    y: round2(inset - 0.5),
    width: round2(Math.max(1, xOf(w1) - xOf(w0))),
    height: round2(height - inset + 0.5),
  };

  // fog = complement of known within the domain
  const knownReal = knownPairs(known);
  const sorted = (knownReal.length > 0 ? knownReal : [[d0, d1] as [number, number]]).sort(
    (p, q) => p[0] - q[0],
  );
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

  return {
    buckets,
    windowRect,
    windowKnown: winPair !== null,
    fogRects,
    markX,
    unknownShare,
    contentTop: round2(contentTop),
    contentBottom: round2(height - inset),
  };
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
