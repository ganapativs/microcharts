// Horizon geometry — pure, React-free (plan/22 #25, S1). The canonical
// micro-density technique: the area is folded into 2–3 opacity bands; darker
// = farther from the baseline. Values exactly at a fold boundary belong to
// the LOWER fold (half-open bands, property-tested). Fold count and mode are
// author-declared, never auto-switched. 2-dp.
import { linePath } from "../../core/path.js";
import { extent } from "../../core/scale.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";

type XY = readonly [number, number];

interface HorizonBand {
  /** Closed area path for this fold slice. */
  d: string;
  /** 1-based fold (1 = nearest the baseline). */
  fold: number;
  sign: 1 | -1;
}

export interface HorizonGeometry {
  bands: HorizonBand[];
  /** Per-fold opacity (index by fold-1). */
  opacities: readonly number[];
  /** Raw values (positions) for the interactive nearest-x readout. */
  xFor: (i: number) => number;
  /** y of a value inside its fold band (interactive dot). */
  foldedY: (v: number) => number;
  n: number;
}

const OPACITY: Record<2 | 3, readonly number[]> = {
  2: [0.42, 0.85],
  3: [0.35, 0.65, 0.9],
};

export function horizonGeometry(opts: {
  width: number;
  height: number;
  values: readonly Value[];
  baseline: number;
  folds: 2 | 3;
  mode: "mirror" | "offset";
  domain?: readonly [number, number] | undefined;
}): HorizonGeometry {
  const { width, height, values, folds, mode } = opts;
  const baseline = Number.isFinite(opts.baseline) ? opts.baseline : 0;
  const n = values.length;
  const pad = 0.5;

  // band height: mirror uses the full strip per sign; offset splits the strip
  const stripTop = pad;
  const stripBot = height - pad;
  const midY = round2((stripTop + stripBot) / 2);

  // fold size from the max |deviation| across folds
  const devs = values.filter(isFiniteValue).map((v) => Math.abs(v - baseline));
  const domainDev =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? Math.max(Math.abs(opts.domain[0] - baseline), Math.abs(opts.domain[1] - baseline))
      : (extent(devs)?.[1] ?? 1);
  const foldSize = Math.max(domainDev / folds, 1e-9);

  const xFor = (i: number) => round2(n > 1 ? pad + (i * (width - pad * 2)) / (n - 1) : width / 2);

  const bands: HorizonBand[] = [];
  const signs: (1 | -1)[] = mode === "mirror" ? [1, -1] : [1, -1];
  for (const sign of signs) {
    for (let fold = 1; fold <= folds; fold++) {
      // this fold's slice of |deviation|: ((fold-1)..fold] × foldSize
      const lo = (fold - 1) * foldSize;
      const hi = fold * foldSize;
      const pts: (XY | null)[] = values.map((v, i) => {
        if (!isFiniteValue(v)) return null;
        const dev = (v - baseline) * sign;
        if (dev <= lo) return null; // half-open: boundary belongs to the LOWER fold
        const t = Math.min(dev, hi) - lo; // 0..foldSize slice
        const frac = t / foldSize;
        let y: number;
        if (mode === "mirror") {
          // both signs render upward from the bottom
          y = stripBot - frac * (stripBot - stripTop);
        } else {
          // offset: positives up from the midline, negatives down
          y = sign > 0 ? midY - frac * (midY - stripTop) : midY + frac * (stripBot - midY);
        }
        return [xFor(i), round2(y)] as const;
      });
      if (!pts.some(Boolean)) continue;
      // area against the band's own baseline
      const base = mode === "mirror" ? stripBot : midY;
      const d = closedArea(pts, base);
      if (d) bands.push({ d, fold, sign });
    }
  }

  const foldedY = (v: number): number => {
    if (!isFiniteValue(v)) return midY;
    const dev = Math.abs(v - baseline);
    const frac = (dev % foldSize) / foldSize || (dev > 0 ? 1 : 0);
    if (mode === "mirror") return round2(stripBot - frac * (stripBot - stripTop));
    return v - baseline >= 0
      ? round2(midY - frac * (midY - stripTop))
      : round2(midY + frac * (stripBot - midY));
  };

  return { bands, opacities: OPACITY[folds], xFor, foldedY, n };
}

/** Closed area between a broken line and a horizontal base (per segment run). */
function closedArea(pts: (XY | null)[], base: number): string {
  let d = "";
  let run: XY[] = [];
  const flush = () => {
    if (run.length === 0) return;
    const line = linePath(run);
    const first = run[0]!;
    const last = run.at(-1)!;
    d += `${line}L${last[0]} ${round2(base)}L${first[0]} ${round2(base)}Z`;
    run = [];
  };
  for (const p of pts) {
    if (p) run.push(p);
    else flush();
  }
  flush();
  return d;
}
