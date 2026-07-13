// GradedBand geometry — pure, React-free. How sure are we
// about ONE number? Nested central intervals graded by opacity, never a bar
// from zero (bar-plus-error-bar induces within-the-bar bias — Correll &
// Gleicher 2014). Opacity maps to probability level and nothing else. Inner
// intervals are clipped inside their outer so quantile-rounding can't invert
// the nesting. Coords 2-dp.
import { quantiles } from "../../core/quantile.js";
import { clamp, extent, scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";

interface GradedBandLevel {
  p: number;
  /** viewBox x + width. */
  x: number;
  width: number;
  /** Data-space bounds (summaries/announces). */
  lo: number;
  hi: number;
  /** 0 = widest/faintest … k-1 = narrowest/strongest (z + opacity). */
  step: number;
}

export interface GradedBandGeometry {
  /** Widest first (draw order). */
  bands: GradedBandLevel[];
  median: { x: number; value: number };
  dot: { x: number; value: number } | null;
  bandY: number;
  bandH: number;
  /** All draws equal → render the median tick only. */
  degenerate: boolean;
  labelX: number;
  labelY: number;
  totalWidth: number;
}

const GRADED_MAX_LEVELS = 3;

export function gradedBandGeometry(opts: {
  width: number;
  height: number;
  data: readonly Value[];
  levels?: readonly number[] | undefined;
  value?: number | undefined;
  domain?: readonly [number, number] | undefined;
  gutterCh?: number;
  fontSize?: number;
}): GradedBandGeometry | null {
  const { width, height } = opts;
  const pad = 3;
  const gutterCh = opts.gutterCh ?? 0;
  const fontSize = opts.fontSize ?? 0;
  const gutter = gutterCh > 0 ? Math.ceil(gutterCh * fontSize * 0.62) + 4 : 0;

  const finite = opts.data.filter(isFiniteValue);
  if (finite.length === 0) return null;

  // levels: sorted ASCENDING, deduped, 1..3 (ES2022 — spread + sort)
  const levels = [...new Set((opts.levels ?? [50, 80, 95]).filter((l) => l > 0 && l < 100))]
    .sort((a, b) => a - b)
    .slice(0, GRADED_MAX_LEVELS);
  if (levels.length === 0) return null;

  const median = quantiles(finite, [0.5])![0]!;

  // interval bounds per level (widest level first for z-order)
  const desc = [...levels].sort((a, b) => b - a);
  const bounds = desc.map((p) => {
    const tail = (1 - p / 100) / 2;
    const [lo, hi] = quantiles(finite, [tail, 1 - tail])! as [number, number];
    return { p, lo, hi };
  });

  // clip each inner interval inside the one outside it (nesting invariant)
  for (let i = 1; i < bounds.length; i++) {
    bounds[i]!.lo = Math.max(bounds[i]!.lo, bounds[i - 1]!.lo);
    bounds[i]!.hi = Math.min(bounds[i]!.hi, bounds[i - 1]!.hi);
  }

  const widest = bounds[0]!;
  const degenerate = widest.lo === widest.hi;

  const values = opts.value !== undefined && isFiniteValue(opts.value) ? [opts.value] : [];
  const dataDomain: readonly [number, number] =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? opts.domain
      : (extent([...finite, ...values]) ?? [0, 1]);
  const domain: readonly [number, number] =
    dataDomain[0] === dataDomain[1] ? [dataDomain[0] - 1, dataDomain[1] + 1] : dataDomain;
  const scale = scaleLinear(domain, [pad, width - pad]);
  const x = (v: number) => round2(clamp(scale(v), pad, width - pad));

  const bandH = round2(Math.max(3, height * 0.5));
  const bandY = round2((height - bandH) / 2);

  const bands: GradedBandLevel[] = bounds.map((b, i) => ({
    p: b.p,
    x: x(b.lo),
    width: round2(x(b.hi) - x(b.lo)),
    lo: round2(b.lo),
    hi: round2(b.hi),
    step: i, // widest (i=0) → step 0 (faintest); narrowest → step k-1 (strongest)
  }));

  return {
    bands,
    median: { x: x(median), value: round2(median) },
    dot: values.length ? { x: x(values[0]!), value: round2(values[0]!) } : null,
    bandY,
    bandH,
    degenerate,
    labelX: width + gutter,
    labelY: round2(height / 2),
    totalWidth: width + gutter,
  };
}
