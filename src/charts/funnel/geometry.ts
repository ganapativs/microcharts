// Funnel: Rectangles
// only: heights ∝ value, zero-anchored — the smooth tapered silhouette
// interpolates data that doesn't exist. `rate` normalizes every stage to the
// FIRST stage (never the previous — that hides compounding loss). 2-dp.
import { isFiniteValue, round2, type Value } from "../../core/types.js";
import { labelFitsY, labelFont } from "../../core/labels.js";
import { maxOf } from "../../core/scale.js";

/** Documented default box — also the fallback for a box that can't be painted in. */
const W = 60;
const H = 18;

export type FunnelLabel = "none" | "percent" | "value";

/**
 * One viewBox side. `<Chart>` clamps a non-finite or non-positive box before it
 * writes the `viewBox`, so geometry has to resolve it the same way or the marks
 * are laid out on a scale the box never had: `width={NaN}` painted `x="NaN"
 * width="NaN"` on every column under a perfectly normal accessible name.
 */
function side(n: number, fallback: number): number {
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Label size the funnel actually paints at, 0 when the labels are off or won't
 * fit. `labelFont` floors at 7, so in a short cell the text landed below the
 * viewBox while the reserved gutter ate the whole plot — the columns vanished
 * and only the spilled labels were left. Both entries read this through
 * `FunnelGeometry.fontSize`, so their stages agree.
 */
function labelSize(height: number, label: FunnelLabel): number {
  if (label === "none") return 0;
  const f = labelFont(height, 0.35);
  return labelFitsY(f * 0.9, f, height, false) ? f : 0;
}

interface FunnelStage {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Share of the first stage (1 for stage 0). */
  share: number;
  index: number;
}

export interface FunnelGeometry {
  stages: FunnelStage[];
  /** Connector slats between consecutive stages (retained share). */
  slats: { d: string }[];
  labelsFit: (chars: number) => boolean;
  pitch: number;
  /** The box actually laid out in — resolved, so the caller's viewBox matches. */
  width: number;
  height: number;
  /** Resolved label size in viewBox units; 0 = no labels. */
  fontSize: number;
}

export function funnelGeometry(opts: {
  width: number;
  height: number;
  values: readonly Value[];
  mode: "absolute" | "rate";
  gap?: number | undefined;
  connectors: boolean;
  label: FunnelLabel;
}): FunnelGeometry {
  const { values, mode, connectors } = opts;
  const width = side(opts.width, W);
  const height = side(opts.height, H);
  const fontSize = labelSize(height, opts.label);
  const finite = values.map((v) => (isFiniteValue(v) && v >= 0 ? v : 0));
  const n = finite.length;
  const box = { width, height, fontSize };
  if (n === 0) return { stages: [], slats: [], labelsFit: () => false, pitch: 0, ...box };

  const first = finite[0] ?? 0;
  const max = mode === "rate" ? 1 : maxOf(finite, 1);
  const rel = finite.map((v) => (mode === "rate" ? (first > 0 ? v / first : 0) : v / max));

  // Past the documented 6 stages the fixed gap ate the whole box: `colW` went
  // negative, so every column rendered `width="-0.88"` (an SVG attribute error
  // — nothing paints) and the row marched past the viewBox. Shrinking the gap
  // instead keeps the columns positive and contained; the funnel degrades to a
  // dense strip, which is what a 40-stage "funnel" is.
  const gap = Math.min(opts.gap ?? 1.5, width / n / 2);
  const colW = (width - gap * (n - 1)) / n;
  const pitch = colW + gap;
  // labels (when shown) reserve a top gutter
  const topGutter = fontSize > 0 ? fontSize + 1 : 0;
  // A short box can still reserve more gutter than it has; without the floor
  // every column got a negative `h` and a `y` past the bottom edge.
  const usableH = Math.max(0, height - topGutter);

  const stages: FunnelStage[] = rel.map((r, index) => {
    // rate-mode overshoot (a stage above the first) clamps visually at 100% —
    // the summary's inversion note carries the truth
    const h = round2(Math.min(usableH, Math.max(r > 0 ? 0.5 : 0, r * usableH)));
    const x = round2(index * pitch);
    return {
      x,
      y: round2(height - h),
      w: round2(Math.min(colW, round2(width - x))),
      h,
      share: round2(first > 0 ? finite[index]! / first : 0),
      index,
    };
  });

  const slats: { d: string }[] = [];
  if (connectors) {
    for (let i = 0; i < n - 1; i++) {
      const a = stages[i]!;
      const b = stages[i + 1]!;
      if (a.h <= 0 && b.h <= 0) {
        slats.push({ d: "" });
        continue;
      }
      // trapezoid from the right edge of stage i to the left edge of stage i+1
      slats.push({
        d: `M${round2(a.x + a.w)} ${a.y}L${b.x} ${b.y}L${b.x} ${height}L${round2(a.x + a.w)} ${height}Z`,
      });
    }
  }

  return {
    stages,
    slats,
    // No label size, no label: a 0 here means the box couldn't seat the text,
    // and a width test alone would have waved it through at font-size zero.
    labelsFit: (chars) => fontSize > 0 && chars * fontSize * 0.62 <= colW,
    pitch,
    ...box,
  };
}
