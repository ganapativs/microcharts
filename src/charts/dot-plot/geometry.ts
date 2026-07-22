// DotPlot geometry — pure, React-free. Dot position on one
// common scale: minimum ink per comparison. Without `stem` the domain may be
// data-fit (position read); WITH `stem` the domain is forced through zero
// (magnitude read) — the prop flips the honesty regime. Coords 2-dp.
import { clamp, extent, scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";
import { proseCharsThatFit, textGutterProse } from "../../core/labels.js";

interface DotRow {
  /** Row center on the category axis. */
  y: number;
  /** Dot position on the value axis (null slot → no dot). */
  x: number | null;
  /** Stem origin (zero) on the value axis. */
  stemX0: number;
  /** De-overlap nudge applied within the row band (legibility, documented). */
  nudge: number;
  index: number;
}

export interface DotPlotGeometry {
  rows: DotRow[];
  /** Label anchor (text-anchor="end") on the value axis start side. */
  labelX: number;
  zeroX: number;
  /** Row pitch for interactive band lookup. */
  pitch: number;
  /** Plot x-range [x0, x1] (after the label gutter). */
  x0: number;
  x1: number;
  fontSize: number;
}

/** Row-pitch-aware type size — denser than `labelFont` so micro DotPlots keep
 *  category labels, taller plates still climb to the shared 11-unit ceiling. */
export function dotPlotFontSize(height: number, rows: number): number {
  const pitch = rows > 0 ? height / rows : height;
  // Progressive floor: 7 when rows are roomy (≥9), else 6 — never lower. Below
  // 6 units the type is illegible; dense plates CULL via showCategories
  // instead (shrinking the type is not an escape hatch — see labelFitsBand).
  const floor = pitch >= 9 ? 7 : 6;
  return Math.min(11, Math.max(floor, Math.round(pitch * 0.48)));
}

/** How many category characters the left gutter can afford at this width.
 *  The budget must use the SAME per-char estimate the gutter is reserved at
 *  (`textGutterProse`, via `proseCharsThatFit`) — an optimistic divisor here
 *  hands the reservation over half the plot at mid widths. Floor of 6 keeps
 *  the micro default usable; cap of 14 stops labels from eating a figure. */
export function dotPlotLabelChars(width: number, fontSize: number, longest: number): number {
  const budget = Math.max(6, proseCharsThatFit(width * 0.32, fontSize, 3));
  return Math.min(14, budget, Math.max(1, longest));
}

export function dotPlotGeometry(opts: {
  width: number;
  height: number;
  values: readonly Value[];
  domain?: readonly [number, number] | undefined;
  /** Reserved label gutter in ch (0 = no labels). */
  gutterCh: number;
  fontSize: number;
  stem: boolean;
}): DotPlotGeometry {
  const { width, height, values, gutterCh, fontSize, stem } = opts;
  const n = values.length;
  const r = 2;

  // Caller-supplied row label, not a figure we formatted — see textGutterProse.
  const gutter = gutterCh > 0 ? textGutterProse(gutterCh, fontSize, 3) : 0;
  const x0 = gutter + r;
  const x1 = width - r;

  let domain =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? opts.domain
      : (extent(values) ?? [0, 1]);
  if (domain[0] === domain[1]) domain = [domain[0] - 1, domain[1] + 1];
  // stem = magnitude-from-zero read: the domain must include zero (documented)
  if (stem) domain = [Math.min(0, domain[0]), Math.max(0, domain[1])];

  const scale = scaleLinear(domain, [x0, x1]);
  const zeroX = round2(clamp(scale(0), x0, x1));

  const pitch = n > 0 ? height / n : 0;
  // deterministic de-overlap: rows whose dot x collides with the PREVIOUS
  // row's dot (within one radius) nudge 0.5 units down within their band
  const xs: (number | null)[] = values.map((v) =>
    isFiniteValue(v) ? round2(clamp(scale(v), x0, x1)) : null,
  );
  const rows: DotRow[] = xs.map((x, i) => {
    const prev = i > 0 ? (xs[i - 1] ?? null) : null;
    const nudge = x !== null && prev !== null && Math.abs(x - prev) < r ? 0.5 : 0;
    return {
      y: round2(clamp(pitch * (i + 0.5) + nudge, r, height - r)),
      x,
      stemX0: zeroX,
      nudge,
      index: i,
    };
  });

  return {
    rows,
    labelX: gutter > 0 ? gutter - 3 : 0,
    zeroX,
    pitch,
    x0,
    x1,
    fontSize,
  };
}

/** Truncate a category label by CHARACTER COUNT — text is never measured, so
 * the static path stays server-renderable. */
export function truncateLabel(label: string, max = 6): string {
  return label.length <= max ? label : `${label.slice(0, max)}…`;
}
