// EventTimeline: Spans + point
// events on ONE linear time axis: duration is length, never log/compressed
// time. Items overlapping the window edge are clipped flat (honest partial
// visibility); fully-outside items are excluded (the component dev-warns).
// `coverage` merges intervals first — overlaps never double-count.
import { clamp, scaleLinear } from "../../core/scale.js";
import { proseCharsThatFit } from "../../core/labels.js";
import { round2 } from "../../core/types.js";

interface TimelineSpan {
  x0: number;
  x1: number;
  y: number;
  h: number;
  /** Index into the component's rendered-items array. */
  i: number;
  labelFits: boolean;
  /** True when a window edge cut this span (flat-cut end). */
  clipped: boolean;
}

interface TimelinePoint {
  x: number;
  y: number;
  i: number;
}

export interface EventTimelineGeometry {
  spans: TimelineSpan[];
  points: TimelinePoint[];
  nowX: number | null;
  /** Merged-span fraction of the window, 2-dp. */
  coverage: number;
  track: { x0: number; x1: number; y: number };
  /** Point-diamond half-extent, both axes. Clamped to the lane so the tips
   *  can't leave the box; the renderer must use this, never its own 2.5. */
  r: number;
}

/**
 * The box `<Chart>` will actually paint: it clamps a non-finite or non-positive
 * viewBox side to 1. Every consumer of `width`/`height` has to resolve it the
 * same way or it lays marks out against a box nobody drew — `width={NaN}` put
 * `x="NaN"` on every mark under a clean viewBox and a correct accessible name.
 */
export function timelineBox(width: number, height: number): readonly [number, number] {
  return [
    Number.isFinite(width) && width > 0 ? width : 1,
    Number.isFinite(height) && height > 0 ? height : 1,
  ];
}

export function eventTimelineGeometry(opts: {
  width: number;
  height: number;
  /** ms epoch, pre-normalized + pre-validated by the component. */
  items: readonly { start: number; end?: number | undefined; label?: string | undefined }[];
  domain: readonly [number, number];
  now?: number | undefined;
  fontSize: number;
}): EventTimelineGeometry {
  const { items, fontSize } = opts;
  const [width, height] = timelineBox(opts.width, opts.height);
  // Two units of margin at the default 80, but never more than a quarter of the
  // box: a 4-unit-wide chart inverted the range to [2, 0] and ran time
  // right-to-left.
  const pad = Math.min(2, width / 4);
  const [d0, d1] =
    opts.domain[0] <= opts.domain[1] ? opts.domain : [opts.domain[1], opts.domain[0]];
  const x = scaleLinear([d0, d1 === d0 ? d0 + 1 : d1], [pad, width - pad]);
  const midY = height / 2;
  // A `<rect>` height of 0 or less is an SVG error, so the browser drops the
  // element: below height 5 every span disappeared while the summary still
  // announced "2 spans covering 50% of the window".
  const spanH = Math.min(height, clamp(height - 4, 1, 6));
  // Point-diamond half-extent, clamped to the lane on both axes. The tips sit
  // ±r from the midline and `.mc-root` is `overflow: visible`, so a short box
  // spilled them onto the page rather than clipping them. Clamp AFTER round2:
  // on a sub-centibox side, rounding alone can inflate past the fit.
  const r = Math.min(width / 2, midY, Math.max(0, round2(Math.min(2.5, midY, width / 2))));
  // Containment after round2 — a raw side of 0.009 rounds to 0.01 and would
  // otherwise paint past the viewBox Chart actually drew.
  const fitX = (n: number) => Math.min(width, Math.max(0, round2(n)));
  const fitY = (n: number) => Math.min(height, Math.max(0, round2(n)));

  const spans: TimelineSpan[] = [];
  const points: TimelinePoint[] = [];
  const merged: [number, number][] = [];

  items.forEach((item, i) => {
    const isSpan = item.end !== undefined && item.end !== item.start;
    if (!isSpan) {
      const t = item.start;
      if (t < d0 || t > d1) return; // outside the window
      points.push({
        x: Math.min(width - r, Math.max(r, fitX(clamp(x(t), r, width - r)))),
        y: Math.min(height - r, Math.max(r, fitY(midY))),
        i,
      });
      return;
    }
    const s = Math.min(item.start, item.end as number);
    const e = Math.max(item.start, item.end as number);
    if (e < d0 || s > d1) return; // fully outside
    const cs = Math.max(s, d0);
    const ce = Math.min(e, d1);
    const x0 = fitX(x(cs));
    const x1 = fitX(x(ce));
    const h = Math.min(height, Math.max(0, round2(spanH)));
    const y = Math.min(height - h, Math.max(0, round2(midY - spanH / 2)));
    const estChars = (item.label ?? "").length;
    spans.push({
      x0,
      x1,
      y,
      h,
      i,
      // Span labels are CALLER text drawn inside the span, so the fit test has
      // to use the prose estimator: `0.62` is calibrated for the figures the
      // library formats itself, and an all-caps label measures ~0.64–0.95 per
      // char. At the digits rate a label that does not fit was seated anyway and
      // painted over the span edges. `proseCharsThatFit` is the one sanctioned
      // inverse of that estimate — never invert 0.95 inline.
      labelFits: estChars > 0 && estChars <= proseCharsThatFit(x1 - x0, fontSize, 0),
      clipped: cs !== s || ce !== e,
    });
    // merge into coverage intervals
    let lo = cs;
    let hi = ce;
    for (let k = merged.length - 1; k >= 0; k--) {
      const [ml, mh] = merged[k]!;
      if (mh >= lo && ml <= hi) {
        lo = Math.min(lo, ml);
        hi = Math.max(hi, mh);
        merged.splice(k, 1);
      }
    }
    merged.push([lo, hi]);
  });

  const windowSpan = d1 - d0 || 1;
  const covered = merged.reduce((sum, [lo, hi]) => sum + (hi - lo), 0);
  const nowX =
    opts.now !== undefined && Number.isFinite(opts.now) ? fitX(x(clamp(opts.now, d0, d1))) : null;

  return {
    spans,
    points,
    nowX,
    coverage: Math.round((covered / windowSpan) * 100) / 100,
    track: { x0: fitX(pad), x1: fitX(width - pad), y: fitY(midY) },
    r,
  };
}
