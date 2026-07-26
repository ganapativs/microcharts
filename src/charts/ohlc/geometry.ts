// Ohlc: High-low wick +
// open-close body per period. Domain fits [min(low). max(high)] exactly —
// price charts are position reads (documented like Sparkline's baseline
// note). NEVER downsampled: past maxPeriods the most recent N render and the
// component dev-warns (averaging OHLC lies). 2-dp.
import { clamp, maxOf, minOf, scaleLinear } from "../../core/scale.js";
import { round2 } from "../../core/types.js";
import { textGutter } from "../../core/labels.js";

export interface OhlcInput {
  open: number;
  high: number;
  low: number;
  close: number;
}

interface OhlcMark {
  x: number;
  yH: number;
  yL: number;
  yO: number;
  yC: number;
  /** close > open; doji (open === close) is neutral. */
  up: boolean;
  doji: boolean;
  bodyW: number;
  /**
   * Index of this period in the RENDERED window (the most recent `maxPeriods`)
   * — NOT a position in `marks`. Corrupt periods are dropped, so the space is
   * sparse: consumers must look periods up by this index, never by mark order.
   */
  index: number;
}

export interface OhlcGeometry {
  marks: OhlcMark[];
  /** True when input was truncated to the most recent maxPeriods. */
  truncated: boolean;
  pitch: number;
  /** Indices of corrupt periods (high < low or open/close outside range). */
  invalid: number[];
  /** Plot-box top edge (viewBox units) — the price domain's high. */
  y0: number;
  /** Plot-box bottom edge (viewBox units) — the price domain's low. */
  y1: number;
}

export function ohlcGeometry(opts: {
  width: number;
  height: number;
  periods: readonly OhlcInput[];
  maxPeriods?: number | undefined;
  domain?: readonly [number, number] | undefined;
  gutterCh: number;
  fontSize: number;
}): OhlcGeometry {
  const { width, height, gutterCh, fontSize } = opts;
  // half a unit of inset so a wick's cap is not shaved by the viewBox edge
  const y0 = 0.5;
  const y1 = round2(height - 0.5);
  const maxPeriods = Math.max(1, opts.maxPeriods ?? 20);
  const truncated = opts.periods.length > maxPeriods;
  const periods = truncated ? opts.periods.slice(-maxPeriods) : [...opts.periods];

  const invalid: number[] = [];
  // Carry each surviving period's SOURCE index: dropping a corrupt period
  // shifts every later one, and a mark that only knew its own position would
  // read back against the caller's array off by the number of drops before it.
  const valid: { p: OhlcInput; src: number }[] = [];
  periods.forEach((p, i) => {
    const ok =
      [p.open, p.high, p.low, p.close].every(Number.isFinite) &&
      p.high >= p.low &&
      p.open >= p.low &&
      p.open <= p.high &&
      p.close >= p.low &&
      p.close <= p.high;
    if (ok) valid.push({ p, src: i });
    else invalid.push(i);
  });
  const n = valid.length;
  if (n === 0) return { marks: [], truncated, pitch: 0, invalid, y0, y1 };

  // +5 gap so the last-close value reads as separate from the final candle
  const gutter = gutterCh > 0 ? textGutter(gutterCh, fontSize, 5) : 0;
  const x0 = 1;
  const x1 = width - 1 - gutter;

  const lo = minOf(valid.map((e) => e.p.low));
  const hi = maxOf(valid.map((e) => e.p.high));
  let domain =
    opts.domain && opts.domain.every((d) => Number.isFinite(d)) ? opts.domain : ([lo, hi] as const);
  if (domain[0] === domain[1]) domain = [domain[0] - 1, domain[1] + 1];
  const y = (v: number) => round2(clamp(scaleLinear(domain, [y1, y0])(v), y0, y1));

  const pitch = (x1 - x0) / n;
  const bodyW = round2(Math.max(1, Math.min(4, pitch * 0.6)));

  const marks: OhlcMark[] = valid.map(({ p, src }, slot) => ({
    x: round2(x0 + pitch * (slot + 0.5)),
    yH: y(p.high),
    yL: y(p.low),
    yO: y(p.open),
    yC: y(p.close),
    up: p.close > p.open,
    doji: p.close === p.open,
    bodyW,
    index: src,
  }));

  return { marks, truncated, pitch, invalid, y0, y1 };
}
