// MusicStaff: Pitch = value on a
// 5-line staff (position quantized). order = time. Pitch is the ONLY channel —
// no clefs, stems, beams or bar lines (every other notation convention is decor).
// Coincident equal values are spaced along the time axis, never dodged vertically
// (that would change pitch = lie). All coords 2-dp.
import { clamp, scaleLinear, extent } from "../../core/scale.js";
import { chartSide, isFiniteValue, round2, type Value } from "../../core/types.js";
import { labelFitsY, labelFont, textGutter } from "../../core/labels.js";

/** Default box. Shared with both entries so their prop defaults can't drift. */
export const DEFAULT_WIDTH = 60;
export const DEFAULT_HEIGHT = 28;

/** Shortest staff that still reads as one: about seven note heads at the
 *  default box. Below it the trailing figure has become the chart. */
const MIN_STAFF = 24;

/** Box + label metrics, resolved from the raw props. */
export interface MusicStaffFrame {
  width: number;
  height: number;
  fontSize: number;
  /** Right inset reserved for the trailing figure; 0 when it isn't painted. */
  gutter: number;
}

/**
 * Resolves the box and the trailing label's metrics ONCE, so the static entry,
 * the interactive entry and the geometry all read the same numbers.
 *
 * Every value here was previously trusted verbatim, and all three are as often
 * host-computed as typed:
 *
 * - `width`/`height`: `Chart` clamps the FRAME with `chartSide`, but a chart
 *   that read the raw prop still emitted its marks against it — `height={NaN}`
 *   drew `cy="NaN"`, `height={0}` drew `rx="-0.27"` (a negative radius is an
 *   SVG error, so the note simply vanishes), and `width={-50}` ran the staff
 *   out to x −61 inside a viewBox of 1. Same helper as `Chart`, so the frame
 *   and the marks stay in step.
 * - `fontSize`: a non-finite one poisoned the gutter, the label's x, and
 *   `--mc-label-px` ("NaNpx").
 * - the gutter itself: reserved from the figure's length with no ceiling, so
 *   `label="last"` on `[1, -999999999]` at the default 60×28 asked for 84 units
 *   of a 60-unit box. The staff's right edge landed at x −26 — outside a
 *   viewBox `.mc-root` does not clip — and both notes collapsed onto one x,
 *   which drops the time axis the chart exists to show.
 */
export function musicStaffFrame(opts: {
  width: number;
  height: number;
  fontSize?: number | undefined;
  /** Minimum label size in viewBox units (the chart's `labelSize` prop). */
  labelSize?: number | undefined;
  /** The formatted trailing figure, or undefined when there is no label. */
  labelText?: string | undefined;
}): MusicStaffFrame {
  const width = chartSide(opts.width, DEFAULT_WIDTH);
  const height = chartSide(opts.height, DEFAULT_HEIGHT);
  const given = opts.fontSize;
  const fontSize = isFiniteValue(given) && given > 0 ? given : labelFont(height, 0.55, opts.labelSize);

  let gutter = 0;
  const text = opts.labelText;
  // `labelFitsY` is the library's degradation primitive: a line of text that
  // can't be seated inside the box is DROPPED, never painted half outside it.
  if (text !== undefined && text.length > 0 && labelFitsY(height / 2, fontSize, height)) {
    const want = textGutter(text.length, fontSize, 2);
    // The figure may take half the box, or all but MIN_STAFF units of it —
    // whichever leaves it more room. A wide chart can spare a long gutter; a
    // narrow one can only spare a share. Past that the figure has become the
    // chart, so it drops and the staff takes the width back.
    if (want <= Math.max(width / 2, width - MIN_STAFF)) gutter = want;
  }
  return { width, height, fontSize, gutter };
}

export interface MusicStaffGeometry {
  staffYs: number[];
  notes: {
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    pos: number;
    index: number;
    value: number;
  }[];
  ledger: { x1: number; x2: number; y: number }[];
  /** last note x (for the optional trailing label). */
  lastX: number | null;
  width: number;
}

export function musicStaffGeometry(opts: {
  values: readonly Value[];
  domain?: readonly [number, number] | undefined;
  width: number;
  height: number;
  mode: "staff" | "ledger";
  pad: number;
}): MusicStaffGeometry {
  const { values, width, height, mode, pad } = opts;
  const T = mode === "staff" ? 9 : 13; // total positions (5 lines + 4 spaces, ±2 ledger)
  const staffOffset = mode === "staff" ? 0 : 2; // ledger positions above the top line
  // note head sized from the nominal spacing, then the band is inset by ry so the
  // top/bottom notes never overflow the box
  const half0 = (height - 2 * pad) / (T - 1);
  // round note-heads — a wide oval reads as vertically "pressed" once scaled up,
  // so keep rx == ry (a clean disc on the staff, not a squashed ellipse).
  //
  // Floored at 0: a box shorter than the padding it reserves gives a negative
  // spacing, and `rx="-0.27"` is an SVG *error* — the note isn't drawn small,
  // it isn't drawn at all — while a negative `half` inverts the staff and walks
  // the notes off the top of the viewBox. At that size the staff collapses to
  // one line, which is honest: there is no room left to encode pitch.
  const ryConst = round2(Math.max(0, half0 * 0.82));
  const rxConst = ryConst;
  const bandTop = pad + ryConst;
  const half = Math.max(0, (height - 2 * pad - 2 * ryConst) / (T - 1));
  const posY = (p: number) => round2(bandTop + p * half);

  const staffYs = [0, 1, 2, 3, 4].map((k) => posY(staffOffset + k * 2));
  const topLine = staffOffset;
  const botLine = staffOffset + 8;

  const e = opts.domain ?? extent(values);
  const [lo, hi] = e ?? [0, 1];
  const toPos = scaleLinear([lo, hi], [T - 1, 0]); // high value → top position

  const n = values.length;
  // inset the note band by rx so the outer note ellipses don't overflow the edges
  const innerW = Math.max(0, width - 2 * pad - 2 * rxConst);
  const xAt = (i: number) => round2(pad + rxConst + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW));

  // A ledger tick sits proud of the note head it carries, as engraved. It was a
  // fixed 2.2 that read neither the head nor the pad, so on a short chart (small
  // heads, cx ≈ pad) it reached x −0.2 — outside a viewBox `.mc-root` does not
  // clip. 0.56 is the overhang that reproduces 2.2 at the default 28-unit box.
  const ledgerHalf = rxConst + 0.56;

  const notes: MusicStaffGeometry["notes"] = [];
  const ledger: MusicStaffGeometry["ledger"] = [];
  let lastX: number | null = null;

  values.forEach((v, i) => {
    if (!isFiniteValue(v)) return; // rest (gap)
    const pos = Math.round(clamp(toPos(v), 0, T - 1));
    const cx = xAt(i);
    const cy = posY(pos);
    notes.push({ cx, cy, rx: rxConst, ry: ryConst, pos, index: i, value: v });
    lastX = cx;
    // ledger tick when the note sits above or below the staff
    if (pos < topLine || pos > botLine) {
      ledger.push({
        x1: round2(Math.max(0, cx - ledgerHalf)),
        x2: round2(Math.min(width, cx + ledgerHalf)),
        y: cy,
      });
    }
  });

  return { staffYs, notes, ledger, lastX, width };
}
