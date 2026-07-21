// LikertStrip geometry — pure, React-free.
// Signed segment lengths from a center line via core/stack.divergingStack.
// Graded opacity encodes ordinal distance from neutral, never magnitude. 2-dp.
import { divergingStack, type DivergingStack } from "../../core/stack.js";
import { labelFont, textGutter } from "../../core/labels.js";
import { round2, type Value } from "../../core/types.js";

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

/** Label font size (viewBox units) — `labelFont` floor 7, scaled to strip height. */
export function likertFont(height: number): number {
  return labelFont(height, 0.5);
}

/**
 * End-label gutter reserved on BOTH sides before geometry runs ("100%" worst
 * case = 4 chars). Shared so the static frame and the interactive overlay/
 * hit-test always resolve against the same plot box.
 */
export function likertGutter(labelled: boolean, fontSize: number): number {
  return labelled ? textGutter(4, fontSize, 4) : 0;
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
  // scale share-units (center 0, max extent ±max(neg+half, pos+half)) onto the
  // plot symmetrically so the center line is always the geometric center
  const maxExtent = Math.max(
    ...stack.segments.map((s) => Math.max(Math.abs(s.x0), Math.abs(s.x1))),
    0.5,
  );
  const centerX = round2((x0 + x1) / 2);
  const scale = (x1 - x0) / 2 / maxExtent;

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
      x: round2(centerX + s.x0 * scale),
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
