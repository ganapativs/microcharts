// ABStrips geometry — pure, React-free. Did B beat A — and by
// more than the overlap? Two graded quantile strips on ONE shared x scale; the
// visible overlap of the middle halves IS the answer. Never a bare mean bar —
// the distribution context is mandatory. Coords 2-dp, integer viewBox.
import { quantiles } from "../../core/quantile.js";
import { clamp, extent, scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2 } from "../../core/types.js";
import { textGutter } from "../../core/labels.js";

interface StripRow {
  y: number;
  /** p5–p95 (or min–max for small n). */
  outer: { x: number; width: number };
  /** p25–p75 (the middle half). */
  inner: { x: number; width: number };
  median: { x: number; value: number };
  /** All five quantile edges (p5/25/50/75/95) — interactive stops. */
  edges: { p: number; x: number; value: number }[];
  /** n < 8 → outer is min–max, not p5–p95. */
  small: boolean;
}

export interface ABStripsGeometry {
  rows: [StripRow, StripRow];
  aMedian: number;
  bMedian: number;
  /** b − a median, signed, 2-dp. */
  deltaMedian: number;
  /** p25–75 overlap as a fraction of the smaller middle half, 0–1, 2-dp. */
  overlap: number;
  na: number;
  nb: number;
  labelX: number;
  totalWidth: number;
}

interface RowStats {
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  small: boolean;
}

function rowStats(sample: readonly number[]): RowStats | null {
  const finite = sample.filter(isFiniteValue);
  if (finite.length === 0) return null;
  const [p5, p25, p50, p75, p95] = quantiles(finite, [0.05, 0.25, 0.5, 0.75, 0.95])! as [
    number,
    number,
    number,
    number,
    number,
  ];
  const small = finite.length < 8;
  // small n: tail quantiles are fiction — use the full observed field as outer
  const e = extent(finite)!;
  return { p5: small ? e[0] : p5, p25, p50, p75, p95: small ? e[1] : p95, small };
}

export function abStripsGeometry(opts: {
  width: number;
  height: number;
  a: readonly number[];
  b: readonly number[];
  labelChars?: number;
  domain?: readonly [number, number] | undefined;
  pad?: number | undefined;
  gutterCh?: number | undefined;
  fontSize?: number | undefined;
}): ABStripsGeometry | null {
  const sa = rowStats(opts.a);
  const sb = rowStats(opts.b);
  if (sa === null || sb === null) return null;

  const { width, height } = opts;
  const pad = opts.pad ?? 2;
  const fontSize = opts.fontSize ?? 0;
  const gutterCh = opts.gutterCh ?? 0;
  const gutter = gutterCh > 0 ? Math.ceil(gutterCh * fontSize * 0.72) + 4 : 0;
  // left gutter for the A/B row tags (≈ 2 ch)
  const lead = textGutter(opts.labelChars ?? 2, fontSize, 3);

  const domain: readonly [number, number] =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? opts.domain
      : (() => {
          const e = extent([...opts.a, ...opts.b].filter(isFiniteValue)) ?? [0, 1];
          return e[0] === e[1] ? [e[0] - 1, e[1] + 1] : e;
        })();
  const scale = scaleLinear(domain, [pad + lead, width - pad]);
  const x = (v: number) => round2(clamp(scale(v), pad + lead, width - pad));

  const rowH = (height - 2 * pad) / 2;
  const rowY = (i: number) => round2(pad + rowH * (i + 0.5));

  const mkRow = (s: RowStats, i: number): StripRow => ({
    y: rowY(i),
    outer: { x: x(s.p5), width: round2(x(s.p95) - x(s.p5)) },
    inner: { x: x(s.p25), width: round2(x(s.p75) - x(s.p25)) },
    median: { x: x(s.p50), value: round2(s.p50) },
    edges: [
      { p: 5, x: x(s.p5), value: round2(s.p5) },
      { p: 25, x: x(s.p25), value: round2(s.p25) },
      { p: 50, x: x(s.p50), value: round2(s.p50) },
      { p: 75, x: x(s.p75), value: round2(s.p75) },
      { p: 95, x: x(s.p95), value: round2(s.p95) },
    ],
    small: s.small,
  });

  // middle-half overlap as a fraction of the smaller half
  const overlapLen = Math.max(0, Math.min(sa.p75, sb.p75) - Math.max(sa.p25, sb.p25));
  const smaller = Math.min(sa.p75 - sa.p25, sb.p75 - sb.p25);
  const overlap =
    smaller > 0 ? round2(clamp(overlapLen / smaller, 0, 1)) : sa.p50 === sb.p50 ? 1 : 0;

  return {
    rows: [mkRow(sa, 0), mkRow(sb, 1)],
    aMedian: round2(sa.p50),
    bMedian: round2(sb.p50),
    deltaMedian: round2(sb.p50 - sa.p50),
    overlap,
    na: opts.a.filter(isFiniteValue).length,
    nb: opts.b.filter(isFiniteValue).length,
    labelX: round2(width + 3),
    totalWidth: width + gutter,
  };
}
