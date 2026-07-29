// TraceFold: Where did the
// latency go: one rect per span (x = start wall-clock, width = duration, row =
// nesting depth). the CRITICAL PATH accented. Widths are durations on one linear
// shared time scale — never per-row normalized; the only distortion is a 1-unit
// floor for zero-duration spans. 2-dp.
import { round2 } from "../../core/types.js";
import { minOf } from "../../core/scale.js";

export interface Span {
  label: string;
  start: number;
  duration: number;
  depth: number;
  parent?: number | undefined;
  critical?: boolean | undefined;
}

export interface SpanRect {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  depth: number;
  critical: boolean;
  share: number;
  duration: number;
}

/** `parent` is an index INTO this array, so only a whole number in range can
 *  address a row. A fractional or non-finite parent addresses nothing — treating
 *  it as an index reads `children[1e-9]`, which is `undefined`. */
function parentOf(p: number | undefined, n: number): number | null {
  return p != null && Number.isInteger(p) && p >= 0 && p < n ? p : null;
}

/** Critical-path membership per span index. Explicit flags win; else walk the
 *  parent tree choosing the longest-duration child at each level (ties → earliest
 *  start); with neither, only the root span is on the path. */
export function criticalPath(data: readonly Span[]): boolean[] {
  const n = data.length;
  const flags = data.map((s) => s.critical === true);
  if (flags.some(Boolean)) return flags;

  const hasParents = data.some((s) => parentOf(s.parent, n) !== null);
  const onPath = Array.from({ length: n }, () => false);
  if (n === 0) return onPath;

  if (!hasParents) {
    // no tree → the root (min start / min depth) span alone
    let root = 0;
    for (let i = 1; i < n; i++) {
      if (
        data[i]!.depth < data[root]!.depth ||
        (data[i]!.depth === data[root]!.depth && data[i]!.start < data[root]!.start)
      )
        root = i;
    }
    onPath[root] = true;
    return onPath;
  }

  // children index
  const children: number[][] = data.map(() => []);
  let root = -1;
  data.forEach((s, i) => {
    const p = parentOf(s.parent, n);
    if (p !== null) children[p]!.push(i);
    else if (root < 0) root = i;
  });
  if (root < 0) root = 0;

  let cur = root;
  // `onPath` doubles as the visited set: a `parent` graph with a cycle (a span
  // parented to itself, or any 2-cycle) otherwise walks forever and hangs the
  // tab. Spans are caller data, so the cycle is an input we must survive, not
  // an invariant we can assume.
  while (cur >= 0 && !onPath[cur]) {
    onPath[cur] = true;
    const kids = children[cur]!;
    if (kids.length === 0) break;
    let best = kids[0]!;
    for (const k of kids) {
      if (
        data[k]!.duration > data[best]!.duration ||
        (data[k]!.duration === data[best]!.duration && data[k]!.start < data[best]!.start)
      )
        best = k;
    }
    cur = best;
  }
  return onPath;
}

/** Default box, here rather than in either entry so both fall back to the same
 *  one when a caller passes an unusable `width` (see `chartSide`). */
export const DEFAULT_WIDTH = 120;

/** Default box height: rows tall enough to seat a legible in-bar label. Shared
 *  so both entries fold the same trace to the same size. */
export function traceFoldHeight(depthCount: number): number {
  return Math.min(72, Math.max(24, depthCount * 16));
}

export function traceFoldGeometry(opts: {
  data: readonly Span[];
  width: number;
  height: number;
  rowGap: number;
}): {
  rects: SpanRect[];
  total: number;
  criticalCount: number;
  longest: { label: string; duration: number; critical: boolean } | null;
} {
  const { data, width, height, rowGap } = opts;
  const spans = data.slice(0, 40);
  if (spans.length === 0) return { rects: [], total: 0, criticalCount: 0, longest: null };

  const pad = 1;
  let minStart = Infinity;
  let maxEnd = -Infinity;
  for (const s of spans) {
    if (!Number.isFinite(s.start)) continue;
    const dur = Number.isFinite(s.duration) && s.duration > 0 ? s.duration : 0;
    if (s.start < minStart) minStart = s.start;
    if (s.start + dur > maxEnd) maxEnd = s.start + dur;
  }
  if (!Number.isFinite(minStart)) {
    minStart = 0;
    maxEnd = 1;
  }
  // The span is a DIVISOR for every x. Finite starts and durations can still
  // sum past 1e308, and `Infinity / Infinity` is NaN — which reaches the
  // emitted width and the span disappears. Collapse an unrepresentable trace
  // to a unit span so the rows still draw in order.
  const rawTotal = maxEnd - minStart;
  const total = Number.isFinite(rawTotal) && rawTotal > 0 ? rawTotal : 1;

  // compact depth rows (gaps compacted)
  const depths = [...new Set(spans.map((s) => s.depth))].sort((a, b) => a - b);
  const rowOf = new Map(depths.map((d, i) => [d, i]));
  const rowCount = Math.max(1, depths.length);
  const plotW = width - pad * 2;
  const rowH = (height - pad * 2) / rowCount;
  const xOf = (t: number): number => round2(pad + ((t - minStart) / total) * plotW);

  const flags = criticalPath(spans);
  // "longest" excludes the top depth level — a root span trivially spans the
  // whole trace, so it is never the interesting answer (fall back to all spans
  // only when the trace is flat / single-level).
  const minDepth = minOf(spans.map((s) => s.depth));
  const hasSubLevel = spans.some((s) => s.depth > minDepth);

  let longest: { label: string; duration: number; critical: boolean } | null = null;
  const rects: SpanRect[] = spans.map((s, i) => {
    const dur = Number.isFinite(s.duration) && s.duration > 0 ? s.duration : 0;
    // A span with no start has no place on a wall clock — the domain scan above
    // already skipped it, so feeding its start to `xOf` is what produced
    // x="NaN". It keeps its row (and its index, which `parent` and the
    // interactive picker address it by) but is given no width, so it is drawn as
    // absent rather than as a zero-duration sliver at time 0.
    const placed = Number.isFinite(s.start);
    const x = placed ? xOf(s.start) : round2(pad);
    // `start + dur` can overflow to Infinity even when both are finite, and an
    // infinite end makes `xOf` (and the width) infinite. Clamp the end to the
    // plot's right edge — a span that runs past the trace is drawn as running
    // to the end of it, which is what it means.
    const end = Math.min(s.start + dur, maxEnd);
    const right = placed && Number.isFinite(end) ? xOf(end) : x;
    const w = placed ? round2(Math.max(1, right - x)) : 0;
    const row = rowOf.get(s.depth) ?? 0;
    const eligible = placed && (!hasSubLevel || s.depth > minDepth);
    if (eligible && (!longest || dur > longest.duration))
      longest = { label: s.label, duration: round2(dur), critical: flags[i]! };
    return {
      x,
      y: round2(pad + row * rowH),
      width: w,
      height: round2(Math.max(0.8, rowH - rowGap)),
      label: s.label,
      depth: s.depth,
      critical: flags[i]!,
      share: round2(dur / total),
      duration: round2(dur),
    };
  });

  return { rects, total: round2(total), criticalCount: flags.filter(Boolean).length, longest };
}
