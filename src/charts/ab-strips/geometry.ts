// ABStrips: Did B beat A — and by
// more than the overlap? Two graded quantile strips on ONE shared x scale; the
// visible overlap of the middle halves IS the answer. Never a bare mean bar —
// the distribution context is mandatory. Coords 2-dp, integer viewBox.
import { quantiles } from "../../core/quantile.js";
import { clamp, extent, scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2 } from "../../core/types.js";
import { labelFitsBand, textGutterProse } from "../../core/labels.js";

/**
 * `round2` for the ANNOUNCED numbers (medians, delta, quantile edges). It
 * multiplies by 100 before rounding, so a finite value past ~1.8e306 comes back
 * ±Infinity — a sample of 1e307s announced "median ∞" over a normally painted
 * strip, and the delta gutter printed a literal "NaN%" (∞ ÷ ∞). Two decimals
 * carry no information at that magnitude, so the value passes through instead.
 * Coordinates never need this: they are clamped into the viewBox first.
 */
function roundValue(n: number): number {
  const r = round2(n);
  return Number.isFinite(r) ? r : n;
}

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

/** Largest share of the box the row tags' lead gutter may claim. */
const MAX_LEAD_SHARE = 0.45;

/** Lead gutter (viewBox units) for `chars` of row tag at `fontSize`. */
function tagLead(chars: number, fontSize: number): number {
  // Row tags are CALLER text ("Control cohort"), not figures this library
  // formatted, so they take the prose estimate — `textGutter`'s digit-calibrated
  // 0.62 left an all-caps arm name painting over its own strip.
  return textGutterProse(chars, fontSize, 3);
}

/**
 * Characters of row tag to reserve a lead gutter for — 0 when the tags must
 * drop, which also drops their gutter so the strips reclaim the full width.
 *
 * Two ways they stop fitting, and the answer to both is to drop them. The arms
 * stay distinguishable without tags: row A is neutral ink and row B is accent,
 * top-to-bottom in the summary's order.
 *
 * **Vertically** — the two arms split the padded box into two rows and each tag
 * is centred on its row, so once the row pitch is under one em the tags stack on
 * each other ("A" on "B", "Ctrl" on "Test") and the outer two push their
 * em-boxes past the viewBox edge. There is no smaller type to retreat to.
 *
 * **Horizontally** — this gate was missing, and the lead gutter is unbounded in
 * the tag's length. `seriesLabels={["Control group", "Treatment"]}` squeezed an
 * 80-wide plot down to 16 units; one size up the reserved lead crossed
 * `width - pad` outright, which inverts `scaleLinear`'s range and makes `clamp`
 * pin every x at the lead — every mark landed at x=135 in a 108-wide viewBox,
 * outside a root that is `overflow: visible`.
 */
export function abTagChars(opts: {
  width: number;
  height: number;
  fontSize: number;
  labels: readonly [string, string];
  pad?: number | undefined;
}): number {
  const pad = opts.pad ?? 2;
  if (!labelFitsBand((opts.height - pad * 2) / 2, opts.fontSize)) return 0;
  const chars = Math.max(opts.labels[0].length, opts.labels[1].length);
  const fits = tagLead(chars, opts.fontSize) + pad * 2 <= opts.width * MAX_LEAD_SHARE;
  return fits ? chars : 0;
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
  // left gutter for the A/B row tags (≈ 2 ch). `labelChars: 0` means the caller
  // dropped the tags (see `abTagChars`) — the gutter goes with them, so the two
  // strips reclaim the full width rather than sitting against dead space. The
  // cap is the containment backstop for a direct caller that skipped the gate: a
  // lead past `width - pad` inverts the scale's range and clamps every mark to a
  // coordinate outside the viewBox.
  const labelChars = opts.labelChars ?? 2;
  const lead =
    labelChars > 0
      ? Math.min(tagLead(labelChars, fontSize), Math.max(0, width * MAX_LEAD_SHARE - pad * 2))
      : 0;

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
    median: { x: x(s.p50), value: roundValue(s.p50) },
    edges: [
      { p: 5, x: x(s.p5), value: roundValue(s.p5) },
      { p: 25, x: x(s.p25), value: roundValue(s.p25) },
      { p: 50, x: x(s.p50), value: roundValue(s.p50) },
      { p: 75, x: x(s.p75), value: roundValue(s.p75) },
      { p: 95, x: x(s.p95), value: roundValue(s.p95) },
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
    aMedian: roundValue(sa.p50),
    bMedian: roundValue(sb.p50),
    deltaMedian: roundValue(sb.p50 - sa.p50),
    overlap,
    na: opts.a.filter(isFiniteValue).length,
    nb: opts.b.filter(isFiniteValue).length,
    labelX: round2(width + 3),
    totalWidth: width + gutter,
  };
}
