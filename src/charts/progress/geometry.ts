// Progress: Zero-anchored bar
// length + a right label gutter reserved OUTSIDE the bar ( — never
// measured): the viewBox widens for the label, the track never shrinks, so the
// same fraction renders the same bar length whatever the label says (rows stay
// comparable). `fraction` arrives pre-clamped to [0, 1]; overflow truth lives
// in the label/summary, never in the bar. All coords 2-dp.
import { round2 } from "../../core/types.js";
import { textGutter } from "../../core/labels.js";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ProgressGeometry {
  /** Total viewBox width (bar + reserved label gutter). */
  totalWidth: number;
  track: Rect;
  fill: Rect;
  /** Discrete slots with per-slot fill fraction (0..1), or null (continuous). */
  segments: { x: number; w: number; fill: number }[] | null;
  labelX: number;
  labelY: number;
}

/** Drawn-slot ceiling — one slot is one DOM node and `segments` is caller data. */
const MAX_SEGMENTS = 200;

export function progressGeometry(opts: {
  width: number;
  height: number;
  fraction: number;
  segments?: number | undefined;
  gutterCh: number;
  fontSize: number;
}): ProgressGeometry {
  const { width, height, fraction, segments, gutterCh, fontSize } = opts;
  // gutter from the char estimate (0.62em/char) + a 5-unit gap to the bar so
  // the value reads as separate from the fill, not stuck to it
  const gutter = gutterCh > 0 ? textGutter(gutterCh, fontSize, 5) : 0;
  const barH = Math.max(2, round2(height * 0.5));
  const y = round2((height - barH) / 2);

  const track: Rect = { x: 0, y, w: round2(width), h: barH };
  const fill: Rect = { x: 0, y, w: round2(width * fraction), h: barH };

  let slots: { x: number; w: number; fill: number }[] | null = null;
  if (segments !== undefined && Number.isFinite(segments) && segments >= 2) {
    // One slot is one DOM node and `segments` is unbounded caller data — a
    // stray `segments={1e9}` would exhaust memory before it drew anything
    // readable. Saturate (the fill itself still encodes the true fraction).
    const n = Math.min(MAX_SEGMENTS, Math.floor(segments));
    const gap = 1;
    // exact layout, rounded per slot with the width clamped to the bar so
    // 2-dp rounding can never push the last slot past the track
    const slotW = (width - gap * (n - 1)) / n;
    const segFrac = fraction * n;
    slots = Array.from({ length: n }, (_, i) => {
      const x = round2(i * (slotW + gap));
      return {
        x,
        w: round2(Math.min(slotW, round2(width - x))),
        fill: round2(Math.min(1, Math.max(0, segFrac - i))),
      };
    });
  }

  return {
    totalWidth: width + gutter,
    track,
    fill,
    segments: slots,
    labelX: width + gutter,
    labelY: round2(height / 2),
  };
}
