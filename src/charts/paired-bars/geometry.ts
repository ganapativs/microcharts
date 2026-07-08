// PairedBars geometry — pure, React-free (plan/22 #12, S2-referenced). Actual
// vs expected per category: adjacent (grouped) or ghost-behind (overlay) bars
// on ONE shared zero-anchored domain — comparing bars on different scales is
// the cardinal grouped-bar lie. Coords 2-dp.
import { clamp, niceDomain, scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Pair {
  valueRect: Rect | null;
  refRect: Rect | null;
  index: number;
}

export interface PairedBarsGeometry {
  pairs: Pair[];
  baseline: number;
  /** Pair pitch on the category axis (interactive band lookup). */
  pitch: number;
}

export function pairedBarsGeometry(opts: {
  width: number;
  height: number;
  pairs: readonly { value: Value; ref: Value }[];
  domain?: readonly [number, number] | undefined;
  gap?: number | undefined;
  mode: "grouped" | "overlay";
  orientation: "horizontal" | "vertical";
}): PairedBarsGeometry {
  const { width, height, pairs, gap = 1.5, mode, orientation } = opts;
  const n = pairs.length;
  if (n === 0) return { pairs: [], baseline: 0, pitch: 0 };

  const catLen = orientation === "vertical" ? width : height;
  const valLen = orientation === "vertical" ? height : width;

  // ONE domain across value + ref, zero-anchored (auto: max of both)
  const all = pairs.flatMap((p) => [p.value, p.ref]);
  const domain =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? ([Math.min(0, opts.domain[0]), Math.max(0, opts.domain[1])] as const)
      : niceDomain(all, true);
  const scale =
    orientation === "vertical"
      ? scaleLinear(domain, [valLen, 0])
      : scaleLinear(domain, [0, valLen]);
  const zero = round2(clamp(scale(0), 0, valLen));

  const band = (catLen - gap * (n - 1)) / n;
  const pitch = band + gap;

  const barRect = (v: Value, pos: number, w: number): Rect | null => {
    if (!isFiniteValue(v)) return null;
    const at = clamp(scale(v), 0, valLen);
    const len = Math.max(round2(Math.abs(at - zero)), v === 0 ? 0 : 0.5);
    const lo = round2(clamp(Math.min(at, zero), 0, valLen - len));
    // round the band position FIRST, then clamp the width to what remains —
    // 2-dp rounding can never push the last band past the box (shared rule)
    const p = round2(pos);
    const bw = round2(Math.min(w, round2(catLen - p)));
    return orientation === "vertical"
      ? { x: p, y: lo, w: bw, h: len }
      : { x: lo, y: p, w: len, h: bw };
  };

  const out: Pair[] = pairs.map((p, i) => {
    const start = i * pitch;
    if (mode === "overlay") {
      // ghost = the REFERENCE, full band width behind the value bar
      return {
        refRect: barRect(p.ref, start, band),
        valueRect: barRect(p.value, start + band * 0.15, band * 0.7),
        index: i,
      };
    }
    // grouped: value bar + slimmer ref bar side by side (ref 70% width)
    const half = band / 2;
    return {
      valueRect: barRect(p.value, start, half),
      refRect: barRect(p.ref, start + half + half * 0.15, half * 0.7),
      index: i,
    };
  });

  return { pairs: out, baseline: zero, pitch };
}
