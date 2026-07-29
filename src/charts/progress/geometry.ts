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
  /**
   * Discrete slots with per-slot fill fraction (0..1) and the painted fill
   * width, or null (continuous).
   */
  segments: { x: number; w: number; fill: number; fillW: number }[] | null;
  labelX: number;
  labelY: number;
}

/** Drawn-slot ceiling — one slot is one DOM node and `segments` is caller data. */
const MAX_SEGMENTS = 200;

/**
 * The step count the bar actually draws — the ONE place `segments` is
 * interpreted, so the summary can never announce a track that wasn't painted.
 * `null` means the continuous bar: a non-finite count, or anything under 2, has
 * no steps to step between. A large one saturates at `MAX_SEGMENTS`, because one
 * slot is one DOM node and `segments` is caller data; the saturated track still
 * carries the same fraction, so the proportion survives.
 *
 * Both entries read `segments` raw before this existed, and they disagreed:
 * `segments={Infinity}` painted a plain continuous bar while the accessible name
 * said "Infinity of Infinity steps.", and `segments={1e9}` painted 200 slots
 * while announcing "680000000 of 1000000000 steps."
 */
export function resolveSegments(segments: number | undefined): number | null {
  if (segments === undefined || !Number.isFinite(segments)) return null;
  const n = Math.floor(segments);
  return n >= 2 ? Math.min(MAX_SEGMENTS, n) : null;
}

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

  let slots: ProgressGeometry["segments"] = null;
  const n = resolveSegments(segments);
  if (n !== null) {
    // 1 unit of breathing room between slots, but never more than half the
    // width each slot is entitled to. A fixed gap outgrew the bar once
    // `n > width / 2` — at the 200-slot ceiling on the default 48-wide bar the
    // gaps alone wanted 199 units, so every slot came out with a NEGATIVE
    // width, which is an error in SVG: the browser drops the element and the
    // whole stepped track vanished. Identical to a flat 1 for every count the
    // bar can actually seat.
    const gap = Math.min(1, width / (2 * n));
    // exact layout, rounded per slot with the width clamped to the bar so
    // 2-dp rounding can never push the last slot past the track
    const slotW = (width - gap * (n - 1)) / n;
    const segFrac = fraction * n;
    slots = Array.from({ length: n }, (_, i) => {
      const x = round2(i * (slotW + gap));
      const w = round2(Math.min(slotW, round2(width - x)));
      const fillFrac = round2(Math.min(1, Math.max(0, segFrac - i)));
      return { x, w, fill: fillFrac, fillW: round2(w * fillFrac) };
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
