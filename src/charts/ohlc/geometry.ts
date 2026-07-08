// Ohlc geometry — pure, React-free (plan/22 #24, structured). High-low wick +
// open-close body per period. Domain fits [min(low), max(high)] exactly —
// price charts are position reads (documented like Sparkline's baseline
// note). NEVER downsampled: past maxPeriods the most recent N render and the
// component dev-warns (averaging OHLC lies). 2-dp.
import { clamp, scaleLinear } from "../../core/scale.js";
import { round2 } from "../../core/types.js";

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
  index: number;
}

export interface OhlcGeometry {
  marks: OhlcMark[];
  /** True when input was truncated to the most recent maxPeriods. */
  truncated: boolean;
  pitch: number;
  /** Indices of corrupt periods (high < low or open/close outside range). */
  invalid: number[];
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
  const maxPeriods = Math.max(1, opts.maxPeriods ?? 20);
  const truncated = opts.periods.length > maxPeriods;
  const periods = truncated ? opts.periods.slice(-maxPeriods) : [...opts.periods];

  const invalid: number[] = [];
  const valid = periods.filter((p, i) => {
    const ok =
      [p.open, p.high, p.low, p.close].every(Number.isFinite) &&
      p.high >= p.low &&
      p.open >= p.low &&
      p.open <= p.high &&
      p.close >= p.low &&
      p.close <= p.high;
    if (!ok) invalid.push(i);
    return ok;
  });
  const n = valid.length;
  if (n === 0) return { marks: [], truncated, pitch: 0, invalid };

  // +5 gap so the last-close value reads as separate from the final candle
  const gutter = gutterCh > 0 ? Math.ceil(gutterCh * fontSize * 0.62) + 5 : 0;
  const x0 = 1;
  const x1 = width - 1 - gutter;

  const lo = Math.min(...valid.map((p) => p.low));
  const hi = Math.max(...valid.map((p) => p.high));
  let domain =
    opts.domain && opts.domain.every((d) => Number.isFinite(d)) ? opts.domain : ([lo, hi] as const);
  if (domain[0] === domain[1]) domain = [domain[0] - 1, domain[1] + 1];
  const y = (v: number) =>
    round2(clamp(scaleLinear(domain, [height - 0.5, 0.5])(v), 0.5, height - 0.5));

  const pitch = (x1 - x0) / n;
  const bodyW = round2(Math.max(1, Math.min(4, pitch * 0.6)));

  const marks: OhlcMark[] = valid.map((p, index) => ({
    x: round2(x0 + pitch * (index + 0.5)),
    yH: y(p.high),
    yL: y(p.low),
    yO: y(p.open),
    yC: y(p.close),
    up: p.close > p.open,
    doji: p.close === p.open,
    bodyW,
    index,
  }));

  return { marks, truncated, pitch, invalid };
}
