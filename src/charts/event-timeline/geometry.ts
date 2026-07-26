// EventTimeline geometry — pure, React-free. Spans + point
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
  const { width, height, items, fontSize } = opts;
  const pad = 2;
  const [d0, d1] =
    opts.domain[0] <= opts.domain[1] ? opts.domain : [opts.domain[1], opts.domain[0]];
  const x = scaleLinear([d0, d1 === d0 ? d0 + 1 : d1], [pad, width - pad]);
  const midY = height / 2;
  const spanH = Math.min(6, height - 4);
  const DIAMOND = 2.5; // point-diamond half-width — clamped inside the viewBox

  const spans: TimelineSpan[] = [];
  const points: TimelinePoint[] = [];
  const merged: [number, number][] = [];

  items.forEach((item, i) => {
    const isSpan = item.end !== undefined && item.end !== item.start;
    if (!isSpan) {
      const t = item.start;
      if (t < d0 || t > d1) return; // outside the window
      points.push({ x: round2(clamp(x(t), DIAMOND, width - DIAMOND)), y: round2(midY), i });
      return;
    }
    const s = Math.min(item.start, item.end as number);
    const e = Math.max(item.start, item.end as number);
    if (e < d0 || s > d1) return; // fully outside
    const cs = Math.max(s, d0);
    const ce = Math.min(e, d1);
    const x0 = round2(x(cs));
    const x1 = round2(x(ce));
    const estChars = (item.label ?? "").length;
    spans.push({
      x0,
      x1,
      y: round2(midY - spanH / 2),
      h: round2(spanH),
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
    opts.now !== undefined && Number.isFinite(opts.now) ? round2(x(clamp(opts.now, d0, d1))) : null;

  return {
    spans,
    points,
    nowX,
    coverage: Math.round((covered / windowSpan) * 100) / 100,
    track: { x0: pad, x1: round2(width - pad), y: round2(midY) },
  };
}
