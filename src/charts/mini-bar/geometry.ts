// MiniBar geometry — pure, React-free (plan/22 #6, S2). Bar length from a
// zero-anchored domain (non-negotiable: length lies unless anchored). Null
// values keep their slot (gap — alignment survives). Coords 2-dp.
import { clamp, niceDomain, scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";

interface MiniBarRect {
  x: number;
  y: number;
  w: number;
  h: number;
  sign: 1 | -1 | 0;
  /** Original data index (survives sorting in the component layer). */
  index: number;
  /** Null slot → no rect rendered, but the band position is reserved. */
  empty: boolean;
}

export interface MiniBarGeometry {
  bars: MiniBarRect[];
  /** Baseline position on the value axis (y for vertical, x for horizontal). */
  baseline: number;
  /** Band size along the category axis (for interactive x-band lookup). */
  band: number;
}

export function miniBarGeometry(opts: {
  width: number;
  height: number;
  values: readonly Value[];
  domain?: readonly [number, number] | undefined;
  gap?: number | undefined;
  orientation: "horizontal" | "vertical";
}): MiniBarGeometry {
  const { width, height, values, gap = 1, orientation } = opts;
  const n = values.length;
  if (n === 0) return { bars: [], baseline: 0, band: 0 };

  // category axis length / value axis length
  const catLen = orientation === "vertical" ? width : height;
  const valLen = orientation === "vertical" ? height : width;

  // explicit domains are widened to include zero — bars are zero-anchored, always
  const domain =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? ([Math.min(0, opts.domain[0]), Math.max(0, opts.domain[1])] as const)
      : niceDomain(values, true);

  // value scale: vertical bars grow UP (y-down flip); horizontal grow right
  const scale =
    orientation === "vertical"
      ? scaleLinear(domain, [valLen, 0])
      : scaleLinear(domain, [0, valLen]);
  const zero = round2(clamp(scale(0), 0, valLen));

  const band = (catLen - gap * (n - 1)) / n;
  const bars: MiniBarRect[] = values.map((v, i) => {
    const pos = round2(i * (band + gap));
    const bw = round2(Math.min(band, round2(catLen - pos)));
    if (!isFiniteValue(v)) {
      return orientation === "vertical"
        ? { x: pos, y: zero, w: bw, h: 0, sign: 0, index: i, empty: true }
        : { x: 0, y: pos, w: 0, h: bw, sign: 0, index: i, empty: true };
    }
    // clamp guards degenerate (denormal-span) domains where the affine map
    // explodes — bars can never paint outside the box (containment)
    const at = clamp(scale(v), 0, valLen);
    const sign: 1 | -1 | 0 = v > 0 ? 1 : v < 0 ? -1 : 0;
    // non-zero values always show ≥ 0.5-unit ink; shift the sliver back inside
    // the box when it lands on the far edge (containment)
    if (orientation === "vertical") {
      const h = Math.max(round2(Math.abs(at - zero)), v === 0 ? 0 : 0.5);
      const y = round2(clamp(Math.min(at, zero), 0, valLen - h));
      return { x: pos, y, w: bw, h, sign, index: i, empty: false };
    }
    const w = Math.max(round2(Math.abs(at - zero)), v === 0 ? 0 : 0.5);
    const x = round2(clamp(Math.min(at, zero), 0, valLen - w));
    return { x, y: pos, w, h: bw, sign, index: i, empty: false };
  });

  return { bars, baseline: zero, band: band + gap };
}
