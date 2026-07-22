// StarSpoke geometry — pure, React-free. Spokes radiate
// from center, first at 12 o'clock, clockwise; length = value on ONE shared
// domain. NO contour polygon, ever — the validated finding is that contour-free
// wins for outlier/similarity tasks (an enclosed area lies about magnitude and
// axis order). Faint full-length guides give the read-back scaffold. 2-dp.
import { clamp } from "../../core/scale.js";
import { round2 } from "../../core/types.js";

/** Default spoke domain, shared by both entries. */
export const UNIT_DOMAIN: readonly [number, number] = [0, 1];

export interface Spoke {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Tip (for dots + interactive focus) — sits at the value along the spoke. */
  tx: number;
  ty: number;
  /** Rim anchor (for labels) — fixed at full radius on the axis, so a label
   *  annotates its direction and never collapses toward the hub on low values. */
  rx: number;
  ry: number;
  angle: number;
}

export function starSpokeGeometry(opts: {
  values: readonly number[];
  domain: readonly [number, number];
  width: number;
  height: number;
  /** Margin from the edge — larger reserves a ring for tip labels. */
  pad?: number;
}): { spokes: Spoke[]; guidePath: string; spokePath: string } {
  const { values, domain, width, height, pad = 2 } = opts;
  const cx = width / 2;
  const cy = height / 2;
  const R = Math.min(width, height) / 2 - pad;
  const [d0, d1] = domain;
  const span = d1 - d0 || 1;
  const n = Math.max(1, values.length);

  const spokes: Spoke[] = values.map((v, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n; // 12 o'clock, clockwise
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const len = Number.isFinite(v) ? ((clamp(v, d0, d1) - d0) / span) * R : 0;
    return {
      x1: round2(cx),
      y1: round2(cy),
      x2: round2(cx + dx * len),
      y2: round2(cy + dy * len),
      tx: round2(cx + dx * len),
      ty: round2(cy + dy * len),
      rx: round2(cx + dx * R),
      ry: round2(cy + dy * R),
      angle,
    };
  });

  const guidePath = values
    .map((_v, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      return `M${round2(cx)} ${round2(cy)}L${round2(cx + Math.cos(angle) * R)} ${round2(cy + Math.sin(angle) * R)}`;
    })
    .join("");
  const spokePath = spokes.map((s) => `M${s.x1} ${s.y1}L${s.x2} ${s.y2}`).join("");

  return { spokes, guidePath, spokePath };
}
