// Signed segment lengths from a center line via core/stack.divergingStack.
// Graded opacity encodes ordinal distance from neutral, never magnitude. 2-dp.
import { divergingStack, type DivergingStack } from "../../core/stack.js";
import { labelFitsY, labelFont, textGutter } from "../../core/labels.js";
import { round2, type Value } from "../../core/types.js";
import { maxOf, minOf } from "../../core/scale.js";

interface LikertSegment {
  x: number;
  width: number;
  /** Ordinal level index into the input. */
  level: number;
  side: -1 | 0 | 1;
  /** Opacity grading toward the pole (0.45 → 1). */
  opacity: number;
  share: number;
}

export interface LikertGeometry {
  segments: LikertSegment[];
  centerX: number;
  shares: { negative: number; positive: number; neutral: number };
}

/**
 * The box `<Chart>` will actually paint: it clamps a non-finite or non-positive
 * viewBox side to 1. Everything downstream has to resolve `width`/`height` the
 * same way or it lays the strip out against a box nobody drew — `width={NaN}`
 * (a size read off an unmounted element) put `x1="NaN"` on the center line and
 * `x="NaN"` on an end label under a clean viewBox and a correct summary.
 */
export function likertBox(width: number, height: number): readonly [number, number] {
  return [
    Number.isFinite(width) && width > 0 ? width : 1,
    Number.isFinite(height) && height > 0 ? height : 1,
  ];
}

/** Label font size (viewBox units) — `labelFont` floor 7, scaled to strip height. */
export function likertFont(height: number, min?: number | undefined): number {
  return labelFont(height, 0.5, min);
}

/** Bar thickness: the strip inset a unit top and bottom, never thinner than 3. */
export function likertBarHeight(height: number): number {
  return Math.max(3, height - 4);
}

/**
 * End-label gutter reserved on BOTH sides before geometry runs. What the labels
 * COST; `likertLabels` decides whether they can afford it, and is what both
 * entries call so the frame and the hit test resolve the same plot box.
 *
 * `widest` is the longest string the chart's own percent formatter can produce,
 * so the caller passes what it will actually PAINT. It used to be a hardcoded 4
 * ("100%"), which is one character short the moment the formatter is not en-US —
 * `fr-FR` renders "100 %" with a non-breaking space — and arbitrarily wrong for a
 * caller-supplied `format` function, which may return anything at all. Falls back
 * to 4 so an existing caller keeps its exact reservation.
 */
export function likertGutter(labelled: boolean, fontSize: number, widest = 4): number {
  return labelled ? textGutter(Math.max(4, widest), fontSize, 4) : 0;
}

/**
 * Whether the end labels are drawn, and the gutter both entries must reserve for
 * them — 0 when they are not, so a dropped label never leaves dead space behind.
 *
 * The vertical test is the usual one. The horizontal test is the one this chart
 * was missing: two reserves can be wider than the box, and nothing stopped them.
 * At 40×14 the gutters claimed 44 of 40 units, so every segment came out with a
 * negative width and vanished — a strip with no bar at all, and the two percents
 * painted on top of each other in the middle of it. A caller `format` that
 * returns prose ("24.000 percent") does the same at any width, and there the
 * text ran past the viewBox edge as well.
 *
 * The labels lose once the plot they leave is narrower than the bar is thick: a
 * diverging bar shorter than its own thickness has stopped being a bar, and the
 * mark outranks its annotation.
 */
export function likertLabels(opts: {
  labelled: boolean;
  width: number;
  height: number;
  fontSize: number;
  /** Longest string the caller's own formatter can produce (see `likertGutter`). */
  widest?: number | undefined;
}): { show: boolean; gutter: number } {
  const reserve = likertGutter(true, opts.fontSize, opts.widest);
  const show =
    opts.labelled &&
    labelFitsY(opts.height / 2, opts.fontSize, opts.height) &&
    opts.width - 2 * reserve >= likertBarHeight(opts.height);
  return { show, gutter: show ? reserve : 0 };
}

export function likertStripGeometry(opts: {
  width: number;
  height: number;
  values: readonly Value[];
  neutralIndex?: number | null | undefined;
  neutral: "split" | "omit";
  /** Left/right gutters reserved for end labels (viewBox units). */
  gutterL?: number | undefined;
  gutterR?: number | undefined;
}): LikertGeometry | null {
  const { width, values, neutral, gutterL = 0, gutterR = 0 } = opts;
  const stack: DivergingStack | null = divergingStack(values, {
    ...(opts.neutralIndex !== undefined ? { neutralIndex: opts.neutralIndex } : null),
    neutral,
  });
  if (!stack) return null;

  const x0 = gutterL;
  const x1 = width - gutterR;
  // Map the full signed span onto the plot. Neutral stays at data-zero (the
  // center line), but an unequal poll no longer leaves empty plot on the short
  // pole — the bar fills [x0, x1] and the center line shifts with the lean.
  const dataMin = minOf(
    stack.segments.map((s) => s.x0),
    0,
  );
  const dataMax = maxOf(
    stack.segments.map((s) => s.x1),
    0,
  );
  const dataSpan = Math.max(dataMax - dataMin, 1e-9);
  const scale = (x1 - x0) / dataSpan;
  const toX = (u: number) => round2(x0 + (u - dataMin) * scale);
  const centerX = toX(0);

  const n = values.length;
  const neutralIdx =
    opts.neutralIndex !== undefined ? opts.neutralIndex : n % 2 === 1 ? (n - 1) / 2 : null;

  const segments: LikertSegment[] = stack.segments.map((s) => {
    // ordinal distance from neutral (grading toward the pole)
    const dist =
      s.side === 0
        ? 0
        : neutralIdx !== null
          ? Math.abs(s.index - neutralIdx)
          : s.index < n / 2
            ? Math.ceil(n / 2 - s.index)
            : Math.ceil(s.index - n / 2 + 1);
    const maxDist = Math.max(1, Math.ceil(n / 2));
    return {
      x: toX(s.x0),
      width: round2((s.x1 - s.x0) * scale),
      level: s.index,
      side: s.side,
      opacity: s.side === 0 ? 0.45 : round2(0.45 + (dist / maxDist) * 0.55),
      share: round2(s.share),
    };
  });

  return {
    segments,
    centerX,
    shares: {
      negative: round2(stack.negative),
      positive: round2(stack.positive),
      neutral: round2(stack.neutral),
    },
  };
}
