// Deterministic 1-D label layout: pure arithmetic, no measurement. Given
// desired label positions on one axis, spread them to a
// minimum pitch inside [min, max] with the least total displacement — the
// classic greedy forward/backward sweep. Returns null when they cannot all
// fit (caller falls back to its drop-out rule).
import { round2 } from "./types.js";

/**
 * Canonical in-chart label size (viewBox units): scales with the chart's height
 * and holds a **floor of 7** so text never reads smaller than the rest of the
 * library. `factor` tunes weight per chart (default 0.55 — the common case;
 * label-forward charts use ~0.62, dense strips ~0.4). Capped at 11. This is the
 * one source of truth for label sizing — never hardcode a fixed fontSize.
 */
export function labelFont(height: number, factor = 0.55): number {
  return Math.min(11, Math.max(7, Math.round(height * factor)));
}

/**
 * Type size for a ROW label — a category name beside its own row, in a chart
 * that stacks several (DotPlot, Dumbbell, ABStrips, SproutRow, RubricStrip,
 * TraceFold, EventTimeline …).
 *
 * The input is the row PITCH, not the chart height, and that distinction is the
 * whole reason this exists. `labelFont(height, …)` reads the box, which is right
 * for a chart with one label in it and backwards for a stack: adding rows grows
 * the height, so the type grew while the room per row shrank. Measured before
 * this landed, at an identical 12-unit pitch and 160-unit width, Dumbbell
 * (`labelFont(height, 0.42)`) pinned at the 11-unit ceiling from three rows on
 * while DotPlot (pitch-based) sat at 7 — a 57% difference between two charts
 * doing the same job, side by side in the catalog.
 *
 * Floor and ceiling are `labelFont`'s, so a row label never reads smaller or
 * larger than the rest of the library.
 */
export function rowLabelFont(pitch: number, factor = ROW_LABEL_FACTOR): number {
  return labelFont(pitch, factor);
}

/** DEFAULT share of the chart's width a row-label gutter may claim, for charts
 *  whose row is mostly plot. Charts pass their own where the row is
 *  label-forward — a DotPlot row is a name and one dot, so it earns more of the
 *  width than a Dumbbell row, which has to fit two dots and a connector. What is
 *  shared is the SIZING and the drop rule, not this number; forcing one share on
 *  both dropped every DotPlot label at its 60-unit default. */
export const ROW_LABEL_WIDTH_SHARE = 0.38;
/** DotPlot-class rows: the name is half the mark. */
export const ROW_LABEL_WIDTH_SHARE_WIDE = 0.5;
/** @knipignore — published row-label vocabulary; charts take it through
 *  `rowLabelFont`'s default rather than by name.
 *  Row labels are label-forward by definition — you cannot read the row
 *  without its name — so they take the ~0.62 factor `labelFont` documents for
 *  that case, applied to the PITCH instead of the box. */
export const ROW_LABEL_FACTOR = 0.62;
/** A row label past this stops being a label and starts being a column. */
export const ROW_LABEL_MAX_CHARS = 14;
/**
 * Below this many visible characters a truncation identifies nothing at all —
 * "Am…" is not a row name — so the label DROPS and hands its gutter back to the
 * plot, which is the same degradation rule `labelFitsY` / `labelFitsBand` apply
 * vertically; it had simply never been applied to horizontal truncation.
 *
 * Deliberately LOW. A first pass set this at 7, reasoning that "San F…" and
 * "San J…" are the same label — true, but dropping the name entirely is worse
 * than a weak one, and at DotPlot's default width a 7-char floor removed every
 * category name. What actually protects the plot from a greedy gutter is
 * `ROW_LABEL_WIDTH_SHARE`, not this; this only rules out stubs.
 */
export const ROW_LABEL_MIN_CHARS = 4;

/**
 * How many characters of a row label to paint, or **0 meaning drop it**.
 *
 * `room` is the width the gutter may occupy (normally
 * `width * ROW_LABEL_WIDTH_SHARE`). The budget uses the prose per-char estimate,
 * because row names are author text, not figures the library formatted.
 */
export function rowLabelChars(room: number, fontSize: number, longest: number, pad = 3): number {
  const budget = proseCharsThatFit(room, fontSize, pad);
  if (budget < Math.min(ROW_LABEL_MIN_CHARS, longest)) return 0;
  return Math.min(ROW_LABEL_MAX_CHARS, budget, Math.max(1, longest));
}

/**
 * Reserved gutter width (viewBox units) for a `chars`-long label at `fontSize`,
 * plus a fixed `pad` of breathing room. The `0.62 × fontSize` per-character
 * estimate is a deliberate slight over-estimate for the tabular-nums figures the
 * library renders — wide enough that a reserved gutter never clips — and
 * `Math.ceil` snaps the gutter onto integer viewBox coords. This is the one
 * source of truth for the per-char label estimate; never hardcode `* 0.62`
 * inline for a gutter. (The exact `Math.ceil(chars * fontSize * 0.62) + pad`
 * expression is preserved verbatim so migrated call sites stay bit-identical
 * regardless of whether `fontSize` is integer.)
 */
export function textGutter(chars: number, fontSize: number, pad: number): number {
  return Math.ceil(chars * fontSize * 0.62) + pad;
}

/**
 * Reserved gutter for **caller-supplied category text** — a row name, a series
 * label, anything the library did not format itself.
 *
 * `textGutter`'s 0.62 is calibrated for tabular-nums FIGURES, and for those it
 * holds with room to spare. It does not hold for arbitrary text, and the gap is
 * not marginal. Measured per-character advance (fraction of font size), in the
 * two very different faces this library gets rendered in — Hanken Grotesk on the
 * docs site and the Times fallback in the test environment:
 *
 *   digits `1234567`      0.50 – 0.56    ← what 0.62 was calibrated against
 *   `1,234,567`           0.44 – 0.49
 *   mixed case `Northe…`  0.50 – 0.54
 *   UPPERCASE A–Z         0.635
 *   `MMMMMM…`             0.84 – 0.91
 *   `WWWWWW…`             0.95 – 0.96    ← the bound
 *
 * So an all-caps row label reserved at 0.62 paints outside its gutter, and
 * `.mc-root` is `overflow: visible` — it spills into the page rather than
 * clipping. 0.95 covers the worst case measured in both faces.
 *
 * This over-reserves for the common `Rome`/`North` label, and that is the
 * deliberate trade: the static path may never measure text (it renders on the
 * server), so the estimate has to hold for the worst input, not the usual one.
 * A few units of unused gutter is a smaller failure than a label in the margin.
 * Charts that format their OWN numbers keep using `textGutter`.
 */
export function textGutterProse(chars: number, fontSize: number, pad: number): number {
  return Math.ceil(chars * fontSize * 0.95) + pad;
}

/**
 * Inverse of `textGutterProse`: how many characters of caller-supplied prose fit
 * in `room` viewBox units at `fontSize`, after `pad` breathing room. The one
 * place a chart may turn available width into a character budget — never invert
 * the 0.95 estimate inline.
 */
export function proseCharsThatFit(room: number, fontSize: number, pad: number): number {
  return Math.max(0, Math.floor((room - pad) / (fontSize * 0.95)));
}

/**
 * Does one line of `fontSize` text anchored at baseline `y` fit vertically
 * inside a `height`-tall viewBox? `mid` = `dominant-baseline: central` (the box
 * straddles `y`); otherwise alphabetic (ascent above the baseline, descent
 * below). The 0.78/0.22 ascent/descent split is the same model the craft audit
 * uses, so a chart that gates on this agrees with the gate.
 *
 * This is the DEGRADATION primitive: a label that no longer fits is DROPPED —
 * never painted outside the box, never stacked on its neighbour. Pure
 * arithmetic, because the static path may never measure text.
 */
export function labelFitsY(y: number, fontSize: number, height: number, mid = true): boolean {
  const top = mid ? fontSize * 0.5 : fontSize * 0.78;
  const bottom = mid ? fontSize * 0.5 : fontSize * 0.22;
  return y - top >= 0 && y + bottom <= height;
}

/**
 * Does a horizontally-set label at `fontSize` fit in `band` viewBox units of
 * vertical room? The degradation test: a chart that shrinks must DROP a label it
 * can no longer seat, never draw it overlapping or outside the box.
 *
 * A centred label owns a full em-box vertically, so a band shorter than the font
 * size guarantees one of two failures — the outermost row's text crosses the
 * viewBox edge (`.mc-root` is `overflow: visible`, so it spills into the page
 * rather than clipping), or adjacent rows' text stack on each other. Shrinking
 * the type is not an escape hatch: `labelFont` floors at 7 precisely so text
 * never reads smaller than the rest of the library, which means below that floor
 * the label has to go.
 *
 * `band` is the vertical room the label actually gets — the row pitch for a
 * stacked chart, the full height for a single centred label. Pair a `false` here
 * with dropping the label's reserved gutter in the same branch: a gutter that
 * outlives its label is dead space that shifts the plot for nothing.
 */
export function labelFitsBand(band: number, fontSize: number): boolean {
  return band >= fontSize;
}

/**
 * Seat each label AT its own datum, or drop it.
 *
 * `spreadLabels` moves every label until they all clear `pitch`, which is right
 * when the set has to stay complete. It is wrong when the label NAMES the mark
 * it sits beside: six rows in a 54-unit box moved a Slope label 19 units, a
 * third of the chart, and left three labels nearer a foreign line than their
 * own, so a reader matched names to the wrong data.
 *
 * The rule here: walk the desired positions in order, seat each one at its own
 * coordinate (clamped into `[min, max]`, nudged down to clear the last KEPT
 * label by `pitch`), and DROP it when that seat lands more than **half a pitch**
 * from where it wanted to be. Half a pitch is the bound that earns the
 * association: two kept labels sit `pitch` apart and each is within `pitch / 2`
 * of its own datum, so a kept label is never closer to another kept label's
 * datum than to its own. Dropping rather than displacing is the same degradation
 * `labelFitsY` and `labelFitsBand` apply — a label that cannot be seated is not
 * painted somewhere else.
 *
 * `null` entries pass through as `null`, so a caller can hand in one slot per
 * row and read the result back by row index. Kept seats stay in input order:
 * each is at least `pitch` below the previous kept one.
 */
export function seatLabels(
  desired: readonly (number | null)[],
  pitch: number,
  min: number,
  max: number,
): (number | null)[] {
  const out: (number | null)[] = desired.map(() => null);
  const order = desired
    .map((y, i) => ({ y, i }))
    .filter((o): o is { y: number; i: number } => o.y !== null)
    .sort((a, b) => a.y - b.y); // Array#sort is stable
  let prev = -Infinity;
  for (const o of order) {
    const want = Math.min(Math.max(o.y, min), max);
    const seat = Math.max(want, prev + pitch);
    if (seat <= max && Math.abs(seat - o.y) <= pitch / 2) {
      out[o.i] = round2(seat);
      prev = seat;
    }
  }
  return out;
}

export function spreadLabels(
  desired: readonly number[],
  pitch: number,
  min: number,
  max: number,
): number[] | null {
  const n = desired.length;
  if (n === 0) return [];
  if ((n - 1) * pitch > max - min) return null;

  const order = desired.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y); // Array#sort is stable

  // forward sweep: enforce pitch going down
  const pos: number[] = [];
  for (let k = 0; k < n; k++) {
    const want = Math.min(Math.max(order[k]!.y, min), max);
    pos.push(k === 0 ? want : Math.max(want, pos[k - 1]! + pitch));
  }
  // backward sweep: pull the overflow back up from the bottom
  if (pos[n - 1]! > max) {
    pos[n - 1] = max;
    for (let k = n - 2; k >= 0; k--) {
      pos[k] = Math.min(pos[k]!, pos[k + 1]! - pitch);
    }
  }

  const out = Array.from<number>({ length: n });
  for (let k = 0; k < n; k++) out[order[k]!.i] = round2(pos[k]!);
  return out;
}
