// RubricStrip: Stacked
// horizontal mini-bars: bar THICKNESS = weight share of the height, bar LENGTH =
// score on a shared domain (zero-anchored). No composite/total bar exists and
// none may be added — the type structurally resists collapsing quality into one
// number. Thickness maps to weight share linearly (2-unit floor). 2-dp.
import { normalizeShares } from "../../core/stack.js";
import { clamp, maxOf } from "../../core/scale.js";
import { isFiniteValue, round2 } from "../../core/types.js";
import { labelFitsBand, rowLabelChars, rowLabelFont, textGutterProse } from "../../core/labels.js";

/** Default score domain, shared by both entries (see DEFAULT_PERCENTILES). */
export const UNIT_DOMAIN: readonly [number, number] = [0, 1];

/** Documented box defaults. Both entries resolve against these, because a
 *  non-finite side would otherwise lay the marks out against a box `Chart`
 *  never paints. */
export const DEFAULT_WIDTH = 80;
/** Auto height: one legible row per criterion — floor-7 labels need ~13 units. */
export function defaultHeight(n: number): number {
  return Math.max(14, Math.max(1, n) * 13);
}

/** Vertical room between two rows. */
export const ROW_GAP = 1;
/** Clear space a criterion name keeps from the track it names (was 4 → the
 *  names kissed the bars). Doubles as the gutter's own padding, so the reserved
 *  room and the painted gap can't disagree. */
const LABEL_GAP = 8;
/** Share of the width the criterion names may claim. Above the catalog's
 *  `ROW_LABEL_WIDTH_SHARE` (0.38) on purpose: a rubric row IS its criterion —
 *  drop the name and four bars of different thickness say nothing — so this
 *  chart buys legible names before it buys bar length. */
const LABEL_WIDTH_SHARE = 0.62;

export interface RubricInput {
  label: string;
  score: number;
  weight: number;
}

export interface RubricRow {
  /** Position in `data` — the row's identity for keys and for the picker. Two
   *  criteria may legitimately share a name. */
  index: number;
  label: string;
  y: number;
  height: number;
  barWidth: number;
  trackWidth: number;
  score: number;
  weightShare: number;
}

/** One row's vertical band. Independent of the gutter — which is why it can be
 *  computed before the label decision that sets the gutter. */
export interface RubricBand {
  y: number;
  height: number;
  weightShare: number;
}

const MIN_THICK = 2;

/**
 * A domain arrives from a caller's own `Math.min`/`Math.max` over a series that
 * held a gap, and a single non-finite bound emitted `width="NaN"` on every bar:
 * the browser drops the attribute, the strip paints empty, and the accessible
 * name still reads the real scores out. Each bound falls back to the unit
 * default on its own, so a half-usable domain keeps its usable half.
 */
export function resolveDomain(domain: readonly [number, number]): [number, number] {
  const lo = isFiniteValue(domain[0]) ? domain[0] : UNIT_DOMAIN[0];
  const hi = isFiniteValue(domain[1]) ? domain[1] : UNIT_DOMAIN[1];
  // A span past the float range divides every score to zero — bars vanish under
  // a summary that still names them, the same silent lie in a different shape.
  return Number.isFinite(hi - lo) ? [lo, hi] : [UNIT_DOMAIN[0], UNIT_DOMAIN[1]];
}

/**
 * Row bands, thickness by weight share. Split out of `rubricStripGeometry`
 * because the label-fit test needs the row thicknesses BEFORE the gutter exists
 * — and the gutter only moves the track, never the bands.
 */
export function rubricRowBands(opts: {
  weights: readonly number[];
  height: number;
  gap: number;
}): RubricBand[] {
  const { weights, height, gap } = opts;
  const n = weights.length;
  const shares = normalizeShares(weights);
  const equal = 1 / Math.max(1, n);

  const inset = 0.5;
  const usableH = height - inset * 2 - gap * Math.max(0, n - 1);
  // Reserve the min thickness for every row first, then distribute the rest by
  // weight share — so a thin row stays visible AND the rows never overflow.
  const base =
    n > 0 && MIN_THICK * n <= usableH ? MIN_THICK : Math.max(0, usableH / Math.max(1, n));
  const remaining = Math.max(0, usableH - base * n);

  const bands: RubricBand[] = [];
  let y = inset;
  for (let i = 0; i < n; i++) {
    const share = shares ? (shares.shares[i] ?? equal) : equal;
    const h = round2(base + share * remaining);
    bands.push({ y: round2(y), height: h, weightShare: round2(share) });
    y += h + gap;
  }
  return bands;
}

/**
 * Criterion-name layout: type size, the gutter the names reserve, how many
 * characters of each get painted (`0` = the names drop and the gutter goes with
 * them), and each name's clamped centre.
 *
 * Both entries call this. A second spelling in the client drifted the focus box
 * off the rows it frames, and the gutter has to be the same number on both
 * sides or hover lands off-mark.
 */
export function rubricLabels(opts: {
  names: readonly string[];
  bands: readonly RubricBand[];
  width: number;
  height: number;
  show: boolean;
}): { fontSize: number; gutter: number; chars: number; y: number[] } {
  const { names, bands, width, height, show } = opts;
  const n = Math.max(1, bands.length);
  const fontSize = rowLabelFont(height / n);
  // Keep every name inside the box even where a row is thinner than the type.
  const y = bands.map((b) =>
    round2(Math.max(fontSize * 0.5, Math.min(height - fontSize * 0.5, b.y + b.height / 2))),
  );
  if (!show) return { fontSize, gutter: 0, chars: 0, y };

  // Names clear each other when ADJACENT centres do — not when the average row
  // is tall enough. Thickness is the weight channel here, so one dominant
  // criterion squeezes its neighbours onto the 2-unit floor and their names
  // printed on top of one another while `height / n` still read as roomy. The
  // clamped centres are the ones tested: clamping at the box edge only ever
  // moves a name closer to its neighbour.
  const seats =
    labelFitsBand(height / n, fontSize) && y.every((v, i) => i === 0 || v - y[i - 1]! >= fontSize);
  const longest = maxOf(
    names.map((s) => s.length),
    0,
  );
  const chars = seats ? rowLabelChars(width * LABEL_WIDTH_SHARE, fontSize, longest, LABEL_GAP) : 0;
  return {
    fontSize,
    // `chars + 1`: a truncated name paints an ellipsis on top of its budget, and
    // a gutter reserved for the budget alone let that last glyph sit over the
    // track (same +1 Dumbbell reserves).
    gutter: chars > 0 ? textGutterProse(chars + 1, fontSize, LABEL_GAP) : 0,
    chars,
    y,
  };
}

/** Where a painted criterion name ends — `LABEL_GAP` clear of the track. */
export function labelAnchorX(gutter: number): number {
  return round2(gutter - LABEL_GAP);
}

export function rubricStripGeometry(opts: {
  data: readonly RubricInput[];
  domain: readonly [number, number];
  width: number;
  height: number;
  gutter: number;
  gap: number;
}): { rows: RubricRow[]; targetX: (target: number) => number } {
  const { data, width, height, gutter, gap } = opts;
  const [d0, d1] = resolveDomain(opts.domain);
  const span = d1 - d0 || 1;
  const trackW = round2(Math.max(1, width - gutter));
  const scoreX = (s: number): number =>
    Number.isFinite(s) ? round2(((clamp(s, d0, d1) - d0) / span) * trackW) : 0;

  const bands = rubricRowBands({ weights: data.map((d) => d.weight), height, gap });
  const rows: RubricRow[] = data.map((d, i) => {
    const band = bands[i]!;
    return {
      index: i,
      label: d.label,
      y: band.y,
      height: band.height,
      barWidth: scoreX(d.score),
      trackWidth: trackW,
      score: d.score,
      weightShare: band.weightShare,
    };
  });

  return { rows, targetX: (t: number) => round2(gutter + scoreX(t)) };
}
