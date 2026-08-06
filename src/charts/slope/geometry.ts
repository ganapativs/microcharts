// Slope: (, S2-paired projected on
// time). Two aligned columns, one y-domain (per-column normalization would
// fake convergence). Label fitting is deterministic: rows closer than
// fontSize × 1.1 drop their labels (count × height, no measurement), and the
// category name gets a character budget that scales with the width. 2-dp.
import { clamp, extent, scaleLinear } from "../../core/scale.js";
import { round2 } from "../../core/types.js";
import {
  ROW_LABEL_WIDTH_SHARE,
  labelFont,
  rowLabelChars,
  textGutter,
  textGutterProse,
} from "../../core/labels.js";

interface SlopeLine {
  x0: number;
  y0: number | null;
  x1: number;
  y1: number | null;
  dir: 1 | -1 | 0;
  /** De-overlap nudge applied to coincident endpoints (left, right). */
  nudge0: number;
  nudge1: number;
  index: number;
}

export interface SlopeGeometry {
  lines: SlopeLine[];
  leftLabelX: number;
  rightLabelX: number;
  /** Whether per-row labels fit (deterministic density rule). */
  labelsFit: boolean;
  colX0: number;
  colX1: number;
  domain: readonly [number, number];
}

/** Label font size (viewBox units) — shared by both entries; scales with size. */
export const SLOPE_FONT = 6;
/** Figure-scale CEILING for the type ramp; stays at 6 for the micro 40×40
 *  default. A candidate, not a promise — `slopeFitFrame` walks down from here
 *  until the labels actually fit, so growing the type can never be what drops
 *  the labels it was meant to serve. */
function slopeLabelFont(height: number, width = 40): number {
  return Math.min(labelFont(height, 0.32), Math.max(6, Math.round(width * 0.12)));
}

/**
 * Frame + font resolver shared by BOTH entries: the largest font size in
 * [SLOPE_FONT … slopeLabelFont] whose gutters still leave the plot ≥ its floor
 * (labels kept). Pure arithmetic, ≤ 6 candidate frames — cheap and
 * deterministic. Falls back to the SLOPE_FONT frame (labels dropped) exactly
 * like the old fixed-font path did at micro sizes.
 */
export function slopeFitFrame(opts: {
  width: number;
  height: number;
  data: readonly { from: number; to: number; label: string }[];
  domain?: readonly [number, number] | undefined;
  label: "none" | "value" | "label" | "both";
  fmt: (n: number) => string;
}): { geo: SlopeGeometry; labelsDropped: boolean; fontSize: number; nameChars: number } {
  const { width, height, data, domain, label } = opts;
  // Measure the label CHARACTER counts once, outside the font loop. They are a
  // property of the data, not of the type size — and measuring them costs one
  // `fmt` call per row, so re-measuring per candidate multiplied an `Intl`
  // format over the whole series by the number of candidates (10k rows × 2
  // columns × 6 fonts timed the shared edge suite out in CI). The NAME budget
  // does depend on the type size, so it is derived per candidate — from
  // `chars.longest`, which costs no `fmt` call.
  const chars = slopeLabelChars(data, label, opts.fmt);

  // Choose the size ARITHMETICALLY, then build the geometry once. The fit rule
  // reads only the gutters and the row pitch, so a candidate never needs the
  // line set — and building it per candidate meant paying `slopeGeometry`'s
  // per-row de-overlap scan up to six times over.
  let fontSize = SLOPE_FONT;
  for (let f = slopeLabelFont(height, width); f > SLOPE_FONT; f--) {
    if (labelsFitAt({ width, height, rows: data.length, chars, fontSize: f })) {
      fontSize = f;
      break;
    }
  }
  const pairs = data.map((d) => ({ from: d.from, to: d.to }));
  return {
    ...frameFor({ width, height, pairs, domain, chars, fontSize }),
    fontSize,
  };
}

/**
 * How many characters of the category NAME the right gutter can afford at this
 * width and type size, or 0 meaning drop the name.
 *
 * The budget was a hardcoded 6 on both sides of the contract — a reserved
 * `Math.min(6, label.length) + 1` here and a `truncateLabel(label)` default
 * there — so a 300-unit chart truncated exactly as hard as a 40-unit one and
 * `specialFlagsInternal` and `specialFlagsName` both painted `specia…`, two
 * lines under one name. This is the shared row-label policy every other
 * stacked-row chart already uses (same width share, same 14-char cap, same rule
 * that a stub too short to identify a row drops instead), so the budget grows
 * with the chart: 14 characters at width 300, where 6 was the whole story.
 */
function nameCharsFor(width: number, fontSize: number, longest: number): number {
  return longest > 0 ? rowLabelChars(width * ROW_LABEL_WIDTH_SHARE, fontSize, longest, 3) : 0;
}

/** Right gutter in characters, counting what will actually PAINT:
 *  `<value> <name…>` — the separator only when both parts are there, the
 *  ellipsis only when the name was cut. The paint side truncates at the same
 *  `name` count it is reserved from, so glyphs and gutter cannot drift. */
function rightChars(chars: LabelChars, name: number): number {
  return (
    chars.right + (name > 0 ? name + (chars.right > 0 ? 1 : 0) + (chars.longest > name ? 1 : 0) : 0)
  );
}

/** The `labelsFit` rule, without building the geometry: gutters at this type
 *  size leave the plot at or above its floor, and the row pitch can seat a
 *  line of text. Must stay in step with `slopeGeometry`'s `labelsFit`. */
function labelsFitAt(opts: {
  width: number;
  height: number;
  rows: number;
  chars: LabelChars;
  fontSize: number;
}): boolean {
  const { width, height, rows, chars, fontSize } = opts;
  const r = 1.5;
  const gutterL = chars.left > 0 ? textGutter(chars.left, fontSize, 3) : 0;
  const name = nameCharsFor(width, fontSize, chars.longest);
  const right = rightChars(chars, name);
  // Prose rates apply only while a caller-supplied name is in the gutter; once
  // it drops, what is left is a figure this library formatted.
  const estimateRight = name > 0 ? textGutterProse : textGutter;
  const gutterR = right > 0 ? estimateRight(right, fontSize, 3) : 0;
  const plot = round2(width - gutterR - r) - round2(gutterL + r);
  return plot >= Math.max(10, width * 0.35) && (rows === 0 || height / rows >= fontSize * 1.1);
}

interface LabelChars {
  /** Left gutter: our own formatted `from` value. */
  left: number;
  /** Right gutter: our own formatted `to` value. The name beside it is budgeted
   *  separately, because that budget moves with the width and the type size. */
  right: number;
  /** Longest category name in characters — a property of the DATA, so the font
   *  loop measures it once and turns it into a budget per candidate. */
  longest: number;
}

/** Deterministic label widths in CHARACTERS — independent of the type size, so
 *  a font-fitting loop measures them once rather than per candidate. */
function slopeLabelChars(
  data: readonly { from: number; to: number; label: string }[],
  label: "none" | "value" | "label" | "both",
  fmt: (n: number) => string,
): LabelChars {
  const wantLeft = label === "value" || label === "both";
  const wantLabel = label === "label" || label === "both";
  let left = 0;
  let right = 0;
  let longest = 0;
  for (const d of data) {
    if (wantLeft && Number.isFinite(d.from)) left = Math.max(left, fmt(d.from).length);
    if (wantLeft && Number.isFinite(d.to)) right = Math.max(right, fmt(d.to).length);
    if (wantLabel) longest = Math.max(longest, d.label.length);
  }
  return { left, right, longest };
}

/** One candidate frame: gutters at this type size, with the reclaim rule. */
function frameFor(opts: {
  width: number;
  height: number;
  pairs: readonly { from: number; to: number }[];
  domain?: readonly [number, number] | undefined;
  chars: LabelChars;
  fontSize: number;
}): { geo: SlopeGeometry; labelsDropped: boolean; nameChars: number } {
  const { width, height, pairs, domain, chars, fontSize } = opts;
  const nameChars = nameCharsFor(width, fontSize, chars.longest);
  const geo = slopeGeometry({
    width,
    height,
    pairs,
    domain,
    gutterLeftCh: chars.left,
    gutterRightCh: rightChars(chars, nameChars),
    rightIsProse: nameChars > 0,
    fontSize,
  });
  if (geo.labelsFit) return { geo, labelsDropped: false, nameChars };
  return {
    geo: slopeGeometry({
      width,
      height,
      pairs,
      domain,
      gutterLeftCh: 0,
      gutterRightCh: 0,
      fontSize,
    }),
    labelsDropped: true,
    nameChars,
  };
}

/**
 * The frame BOTH entries render against: label gutters reserved from the
 * deterministic ch counts, plus the reclaim rule — when the gutters ate the
 * plot the labels drop and the room goes back to the lines. The interactive
 * entry must use this too, or its hit-test runs against a different plot box
 * than the SVG the user sees.
 */
export function slopeFrame(opts: {
  width: number;
  height: number;
  data: readonly { from: number; to: number; label: string }[];
  domain?: readonly [number, number] | undefined;
  label: "none" | "value" | "label" | "both";
  fmt: (n: number) => string;
  fontSize?: number;
}): { geo: SlopeGeometry; labelsDropped: boolean; nameChars: number } {
  const { width, height, data, domain, label, fmt, fontSize = SLOPE_FONT } = opts;
  return frameFor({
    width,
    height,
    pairs: data.map((d) => ({ from: d.from, to: d.to })),
    domain,
    chars: slopeLabelChars(data, label, fmt),
    fontSize,
  });
}

export function slopeGeometry(opts: {
  width: number;
  height: number;
  pairs: readonly { from: number; to: number }[];
  domain?: readonly [number, number] | undefined;
  gutterLeftCh: number;
  gutterRightCh: number;
  /**
   * Whether the right gutter carries the caller's category label
   * (`label="label"`/`"both"`) rather than only our own formatted value.
   * Category text needs the wider prose estimate; a formatted figure does not,
   * and over-reserving for it costs enough plot width at the default 40-unit
   * width to push the labels past their own fit threshold and drop them.
   */
  rightIsProse?: boolean | undefined;
  fontSize: number;
}): SlopeGeometry {
  const { width, height, pairs, gutterLeftCh, gutterRightCh, fontSize, rightIsProse } = opts;
  const r = 1.5;
  // The left gutter only ever holds our own formatted value, which is what
  // textGutter's tabular-figure constant is calibrated for.
  const gutterL = gutterLeftCh > 0 ? textGutter(gutterLeftCh, fontSize, 3) : 0;
  const estimateRight = rightIsProse ? textGutterProse : textGutter;
  const gutterR = gutterRightCh > 0 ? estimateRight(gutterRightCh, fontSize, 3) : 0;
  const colX0 = round2(gutterL + r);
  const colX1 = round2(width - gutterR - r);

  const all = pairs.flatMap((p) => [p.from, p.to]);
  let domain =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? opts.domain
      : (extent(all) ?? [0, 1]);
  if (domain[0] === domain[1]) domain = [domain[0] - 1, domain[1] + 1];
  const scale = scaleLinear(domain, [height - r, r]);

  const yAt = (v: number): number | null =>
    Number.isFinite(v) ? round2(clamp(scale(v), r, height - r)) : null;

  // coincident-endpoint de-overlap: per column, endpoints within one radius of
  // an earlier row's endpoint nudge 0.5 units (deterministic, documented)
  const seen0: number[] = [];
  const seen1: number[] = [];
  const lines: SlopeLine[] = pairs.map((p, i) => {
    let y0 = yAt(p.from);
    let y1 = yAt(p.to);
    let nudge0 = 0;
    let nudge1 = 0;
    if (y0 !== null && seen0.some((y) => Math.abs(y - y0!) < r)) {
      nudge0 = 0.5;
      y0 = round2(clamp(y0 + 0.5, r, height - r));
    }
    if (y1 !== null && seen1.some((y) => Math.abs(y - y1!) < r)) {
      nudge1 = 0.5;
      y1 = round2(clamp(y1 + 0.5, r, height - r));
    }
    if (y0 !== null) seen0.push(y0);
    if (y1 !== null) seen1.push(y1);
    return {
      x0: colX0,
      y0,
      x1: colX1,
      y1,
      dir:
        !Number.isFinite(p.from) || !Number.isFinite(p.to)
          ? 0
          : p.to > p.from
            ? 1
            : p.to < p.from
              ? -1
              : 0,
      nudge0,
      nudge1,
      index: i,
    };
  });

  return {
    lines,
    leftLabelX: gutterL > 0 ? gutterL - 3 : 0,
    rightLabelX: round2(width - (gutterR > 0 ? gutterR - 3 : 0)),
    // labels drop when rows are denser than fontSize × 1.1 (density rule) OR
    // when the gutters ate the plot — a slope squeezed under ~35% of its width
    // (or 10 units) reads as a label pile, not a chart
    labelsFit:
      colX1 - colX0 >= Math.max(10, width * 0.35) &&
      (pairs.length === 0 ? true : height / pairs.length >= fontSize * 1.1),
    colX0,
    colX1,
    domain,
  };
}
