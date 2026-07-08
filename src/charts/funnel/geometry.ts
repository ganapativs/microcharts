// Funnel geometry — pure, React-free (plan/22 #19, S3-sequential). Rectangles
// only: heights ∝ value, zero-anchored — the smooth tapered silhouette
// interpolates data that doesn't exist. `rate` normalizes every stage to the
// FIRST stage (never the previous — that hides compounding loss). 2-dp.
import { isFiniteValue, round2, type Value } from "../../core/types.js";

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
}

export function funnelGeometry(opts: {
  width: number;
  height: number;
  values: readonly Value[];
  mode: "absolute" | "rate";
  gap?: number | undefined;
  connectors: boolean;
  fontSize: number;
}): FunnelGeometry {
  const { width, height, values, mode, gap = 1.5, connectors, fontSize } = opts;
  const finite = values.map((v) => (isFiniteValue(v) && v >= 0 ? v : 0));
  const n = finite.length;
  if (n === 0) return { stages: [], slats: [], labelsFit: () => false, pitch: 0 };

  const first = finite[0] ?? 0;
  const max = mode === "rate" ? 1 : Math.max(...finite, 1);
  const rel = finite.map((v) => (mode === "rate" ? (first > 0 ? v / first : 0) : v / max));

  const colW = (width - gap * (n - 1)) / n;
  const pitch = colW + gap;
  // labels (when shown) reserve a top gutter
  const topGutter = fontSize > 0 ? fontSize + 1 : 0;
  const usableH = height - topGutter;

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
    labelsFit: (chars) => chars * fontSize * 0.62 <= colW,
    pitch,
  };
}
