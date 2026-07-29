// StarSpoke: Spokes radiate
// from center, first at 12 o'clock, clockwise; length = value on ONE shared
// domain. NO contour polygon, ever — the validated finding is that contour-free
// wins for outlier/similarity tasks (an enclosed area lies about magnitude and
// axis order). Faint full-length guides give the read-back scaffold. 2-dp.
import { clamp } from "../../core/scale.js";
import { chartSide, round2 } from "../../core/types.js";

/** Default spoke domain, shared by both entries. */
export const UNIT_DOMAIN: readonly [number, number] = [0, 1];

/** Documented default `size`, and the fallback for an unusable one. */
const DEFAULT_SIZE = 80;

/**
 * The glyph's box, resolved once. `size` is a caller prop and a non-finite one
 * is uniquely destructive (see `chartSide`): every radius went NaN, so the
 * spoke path was invalid and the browser dropped it — nothing painted, inside
 * a viewBox `Chart` had already clamped to 1×1, under a correct-sounding
 * accessible name. Rounded because the viewBox carries integers, and the star
 * has to be centred on the box that ships rather than on the raw prop.
 */
export function starBox(size: number): number {
  return Math.max(1, Math.round(chartSide(size, DEFAULT_SIZE)));
}

/**
 * The spoke scale, resolved once. A host that derives `domain` with a reduce
 * over a series holding a NaN, or hands over an unbounded `[-Infinity,
 * Infinity]`, made `(v - d0) / span` either NaN or `Infinity / Infinity` — and
 * every spoke coordinate with it. The path dropped, the star painted empty,
 * and the summary still read a perfectly normal profile. Announced scale and
 * painted scale have to be one scale, so repair to the documented unit domain.
 *
 * A non-finite endpoint always makes the difference non-finite, so the span is
 * the only check needed. Returns the caller's array untouched when it is
 * usable — the interactive entry memoises geometry on domain identity.
 */
export function resolveDomain(
  domain: readonly [number, number] = UNIT_DOMAIN,
): readonly [number, number] {
  const [d0, d1] = domain;
  if (!Number.isFinite(d1 - d0)) return UNIT_DOMAIN;
  // A reversed window is a typo rather than a request to run the scale
  // backwards, so it is swapped (the call Hypnogram already makes): `clamp`
  // against a flipped pair pins every value to the low end, and the whole star
  // collapsed to the hub under a summary still naming a highest and a lowest.
  return d1 < d0 ? [d1, d0] : domain;
}

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
  const { values, pad = 2 } = opts;
  const width = starBox(opts.width);
  const height = starBox(opts.height);
  const cx = width / 2;
  const cy = height / 2;
  // Floored: a `pad` wider than the half-box (a 3-unit chart, or a caller-set
  // ring) inverted every spoke and threw the guide rim outside the viewBox.
  const R = Math.max(0, Math.min(width, height) / 2 - pad);
  const [d0, d1] = resolveDomain(opts.domain);
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
