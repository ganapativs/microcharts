// Slope geometry — pure, React-free (, S2-paired projected on
// time). Two aligned columns, one y-domain (per-column normalization would
// fake convergence). Label fitting is deterministic: rows closer than
// fontSize × 1.1 drop their labels (count × height, no measurement). 2-dp.
import { clamp, extent, scaleLinear } from "../../core/scale.js";
import { round2 } from "../../core/types.js";
import { textGutter, textGutterProse } from "../../core/labels.js";

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
}

/** Label font size (viewBox units) — shared by both entries. */
export const SLOPE_FONT = 6;

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
}): { geo: SlopeGeometry; labelsDropped: boolean } {
  const { width, height, data, domain, label, fmt, fontSize = SLOPE_FONT } = opts;
  const wantLeft = label === "value" || label === "both";
  const wantLabel = label === "label" || label === "both";
  const estLeftCh = wantLeft
    ? data.reduce((m, d) => Math.max(m, Number.isFinite(d.from) ? fmt(d.from).length : 0), 0)
    : 0;
  const estRightCh =
    label === "none"
      ? 0
      : data.reduce(
          (m, d) =>
            Math.max(
              m,
              (wantLeft && Number.isFinite(d.to) ? fmt(d.to).length : 0) +
                (wantLabel ? Math.min(6, d.label.length) + 1 : 0),
            ),
          0,
        );

  const pairs = data.map((d) => ({ from: d.from, to: d.to }));
  const geo = slopeGeometry({
    width,
    height,
    pairs,
    domain,
    gutterLeftCh: estLeftCh,
    gutterRightCh: estRightCh,
    rightIsProse: wantLabel,
    fontSize,
  });
  if (geo.labelsFit) return { geo, labelsDropped: false };
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
  };
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
  };
}
