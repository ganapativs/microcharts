// MiniBar: Bar length from a zero-anchored domain
// (length lies unless anchored). Null values keep their slot (gap — alignment
// survives). Coords 2-dp.
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
  /** Zero-anchored value domain `[min,max]` — the annotation-host y-frame. */
  domain: readonly [number, number];
  /** Plot box top (below any reserved label band) — the seat + annotation frame. */
  y0: number;
  /** Plot box bottom. Vertical bars stand on it; it is the floor seat. */
  y1: number;
}

export function miniBarGeometry(opts: {
  width: number;
  height: number;
  values: readonly Value[];
  domain?: readonly [number, number] | undefined;
  gap?: number | undefined;
  orientation: "horizontal" | "vertical";
  /**
   * Room reserved above the plot for the direct max label (vertical only —
   * horizontal runs value along x, where the label does not render). The plot
   * gives the room up rather than the label borrowing it: `.mc-root` never
   * clips, and label ink painted on bar ink is unreadable.
   */
  topPad?: number | undefined;
}): MiniBarGeometry {
  const { width, height, values, gap = 1, orientation } = opts;
  const n = values.length;
  if (n === 0) return { bars: [], baseline: 0, band: 0, domain: [0, 0], y0: 0, y1: height };

  const catLen = orientation === "vertical" ? width : height;
  const pad =
    orientation === "vertical" && Number.isFinite(opts.topPad)
      ? clamp(opts.topPad as number, 0, height)
      : 0;
  const valLen = orientation === "vertical" ? height - pad : width;

  // explicit domains are widened to include zero — bars are zero-anchored, always
  const domain =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? ([Math.min(0, opts.domain[0]), Math.max(0, opts.domain[1])] as const)
      : niceDomain(values, true);

  // value scale: vertical bars grow UP (y-down flip); horizontal grow right.
  // Vertical runs over the padded plot box [pad, height]; horizontal over [0, width].
  const lo = orientation === "vertical" ? pad : 0;
  const hi = orientation === "vertical" ? height : valLen;
  const scale =
    orientation === "vertical" ? scaleLinear(domain, [hi, lo]) : scaleLinear(domain, [lo, hi]);
  const zero = round2(clamp(scale(0), lo, hi));

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
    const at = clamp(scale(v), lo, hi);
    const sign: 1 | -1 | 0 = v > 0 ? 1 : v < 0 ? -1 : 0;
    // non-zero values always show ≥ 0.5-unit ink; shift the sliver back inside
    // the box when it lands on the far edge (containment)
    if (orientation === "vertical") {
      const h = Math.max(round2(Math.abs(at - zero)), v === 0 ? 0 : 0.5);
      const y = round2(clamp(Math.min(at, zero), lo, hi - h));
      return { x: pos, y, w: bw, h, sign, index: i, empty: false };
    }
    const w = Math.max(round2(Math.abs(at - zero)), v === 0 ? 0 : 0.5);
    const x = round2(clamp(Math.min(at, zero), lo, hi - w));
    return { x, y: pos, w, h: bw, sign, index: i, empty: false };
  });

  return {
    bars,
    baseline: zero,
    band: band + gap,
    domain,
    y0: orientation === "vertical" ? pad : 0,
    y1: height,
  };
}
