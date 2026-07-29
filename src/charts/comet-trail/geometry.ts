// CometTrail: Where
// is the value now, and where has it just been? A head dot at the current value
// plus a fading positional trail of recent points. Opacity encodes AGE only,
// never value — the y position does value. x = age position (newest at right).
// Trail length is context, not data: changing `trail` never changes the head
// read. All coords 2-dp.
import { extent, scaleLinear } from "../../core/scale.js";
import { textGutter } from "../../core/labels.js";
import { round2 } from "../../core/types.js";

/** Age-opacity ramp: newest prior point ≈ 0.7 → oldest ≈ 0.1, 5 steps. */
const AGE_OPACITY = [0.7, 0.55, 0.4, 0.25, 0.1] as const;

/** Documented default for `trail` — one source of truth for both entries. */
export const DEFAULT_TRAIL = 12;

export interface CometTrailGeometry {
  /** Prior points, newest first; opacity encodes age. */
  trail: { cx: number; cy: number; r: number; opacity: number; index: number }[];
  head: { cx: number; cy: number; r: number; index: number } | null;
  labelX: number;
  /** Value at the head, or NaN. */
  last: number;
  /** sign(last - first over the shown window): -1 / 0 / 1. */
  trend: -1 | 0 | 1;
  /** Number of shown finite points (head + trail). */
  count: number;
  width: number;
  height: number;
  /** Top edge of the dot band (`pad` + the vertical inset the head reserves). */
  y0: number;
  /** Bottom edge of the dot band. The band is symmetric, so `y0`/`y1` together
   *  are the inline seat's box. */
  y1: number;
}

const TRAIL_CAP = 20;

/**
 * Right gutter (viewBox units) reserved for the `label="last"` numeral, or 0
 * when the numeral drops. Both entries call this so the gutter they reserve and
 * the plot they draw in can never disagree.
 *
 * It used to be a flat `fontSize * 3` — room for about four digits. `Now
 * 9,876,543` then painted ~25 units past the right edge of a 60-wide viewBox,
 * and `.mc-root` is `overflow: visible`, so that is a spill into the page, not a
 * clip. The reserve is now the library's per-char over-estimate over the text
 * actually being printed, plus the 3 units `labelX` puts between dot and digit.
 */
export function cometLabelBand(
  text: string | null,
  fontSize: number,
  width: number,
  height: number,
): number {
  if (!text) return 0;
  // Degradation rule (Sparkline's): a numeral that no longer fits is DROPPED —
  // never painted half outside the box, never left crushing the trail it
  // annotates. Past 60% of the width there is no window left to read, and 1.2 is
  // the numeral's own vertical clamp (`fontSize * 0.6` each side of the centre),
  // which inverts in a box shorter than that. The summary still says the
  // now-value in both cases.
  const band = textGutter(text.length, fontSize, 3);
  return band <= width * 0.6 && fontSize * 1.2 <= height ? band : 0;
}

export function cometTrailGeometry(opts: {
  values: readonly number[];
  width: number;
  height: number;
  domain?: readonly [number, number] | undefined;
  trail: number;
  pad: number;
  headR?: number | undefined;
  /** Extra vertical inset so the head's side-label centres on it without
   *  clipping the top/bottom edge when the head sits at a value extreme. */
  vPad?: number | undefined;
}): CometTrailGeometry {
  const { width, height, pad } = opts;
  // The head has to fit the box it is drawn in. A caller-set `fontSize` (or a
  // tall chart in a narrow one) made the reserved gutter wider than the plot,
  // `scaleLinear` inverted its range without complaint, and dots landed at
  // negative cx — outside a viewBox that never clips. Quartering the plot also
  // keeps a spread left for the trail instead of stacking it under one head.
  const headR = Math.max(
    0.5,
    Math.min(opts.headR ?? Math.max(1.2, height * 0.14), (width - 2 * pad) / 4),
  );
  // The value scale must keep every point (esp. the head at min/max) at least a
  // label half-height from the edge, so the side numeral always aligns to the
  // head — but never so far in that the band collapses or turns inside out.
  const vInset = Math.min(Math.max(headR, opts.vPad ?? 0), (height - 2 * pad) * 0.4);
  const trailR = Math.max(0.8, headR * 0.7);
  // `trail` is usually computed by the host, and `Number("")` is NaN. A NaN
  // floor slipped past both clamps, and `slice(-NaN)` is `slice(0)` — so a
  // 500-point stream painted all 500 dots, 25× the documented cap.
  const asked = Math.floor(opts.trail);
  const keep = (Number.isNaN(asked) ? DEFAULT_TRAIL : Math.min(TRAIL_CAP, Math.max(0, asked))) + 1;
  // The band the dots can occupy — the value scale's own range. Data-independent,
  // so it holds for the empty case too.
  const y0 = round2(pad + vInset);
  const y1 = round2(height - pad - vInset);

  const finite = opts.values.filter((v) => Number.isFinite(v));
  const shown = finite.slice(-keep);
  const count = shown.length;

  const empty: CometTrailGeometry = {
    trail: [],
    head: null,
    labelX: round2(width - pad),
    last: NaN,
    trend: 0,
    count: 0,
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
    y0,
    y1,
  };
  if (count === 0) return empty;

  let yd =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? (opts.domain as [number, number])
      : (extent(shown) ?? [0, 1]);
  if (yd[0] === yd[1]) yd = [yd[0] - 1, yd[1] + 1];

  const sx = scaleLinear([0, Math.max(1, count - 1)], [pad + headR, width - pad - headR]);
  const sy = scaleLinear(yd, [height - pad - vInset, pad + vInset]);

  // Index 0 = oldest shown, count-1 = head (newest, right).
  const headOrigIndex = finite.length - 1;
  const baseOrig = finite.length - count;

  const head = {
    cx: round2(sx(count - 1)),
    cy: round2(sy(shown[count - 1]!)),
    r: round2(headR),
    index: headOrigIndex,
  };

  const trail: CometTrailGeometry["trail"] = [];
  for (let i = count - 2; i >= 0; i--) {
    const age = count - 1 - i; // 1 = most recent prior
    const frac = count <= 2 ? 0 : (age - 1) / (count - 2);
    const step = Math.min(4, Math.round(frac * 4));
    trail.push({
      cx: round2(sx(i)),
      cy: round2(sy(shown[i]!)),
      r: trailR,
      opacity: AGE_OPACITY[step]!,
      index: baseOrig + i,
    });
  }

  const first = shown[0]!;
  const last = shown[count - 1]!;
  const trend: -1 | 0 | 1 = last > first ? 1 : last < first ? -1 : 0;

  return {
    trail,
    head,
    labelX: round2(head.cx + headR + 3),
    last,
    trend,
    count,
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
    y0,
    y1,
  };
}
