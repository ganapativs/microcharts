// Horizon: The canonical
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
  /** Strip top edge — the deterministic plot box, padded, never data-derived. */
  y0: number;
  /** Strip bottom edge; in `"mirror"` every band grows upward from it. */
  y1: number;
  n: number;
}

const OPACITY: Record<2 | 3, readonly number[]> = {
  2: [0.42, 0.85],
  3: [0.35, 0.65, 0.9],
};

/**
 * `folds` → a fold count the opacity table actually has. `OPACITY` is indexed
 * by the prop, so a JS caller's `folds={4}` (or a config-driven `2.5`/`NaN`)
 * handed back `undefined` and the first band read `undefined[0]` — a TypeError
 * that took down the whole render, not just the mark. `folds={Infinity}` was
 * worse: the band loop is `fold <= folds`, so it never ended and the tab ran
 * out of memory. Anything off the table falls back to the documented 2.
 */
export function resolveFolds(folds: number | undefined): 2 | 3 {
  return folds === 3 ? 3 : 2;
}

export function horizonGeometry(opts: {
  width: number;
  height: number;
  values: readonly Value[];
  baseline: number;
  folds: 2 | 3;
  mode: "mirror" | "offset";
  domain?: readonly [number, number] | undefined;
}): HorizonGeometry {
  const { width, height, values, mode } = opts;
  const folds = resolveFolds(opts.folds);
  const baseline = Number.isFinite(opts.baseline) ? opts.baseline : 0;
  const n = values.length;
  const pad = 0.5;

  // band height: mirror uses the full strip per sign; offset splits the strip
  const stripTop = pad;
  const stripBot = height - pad;
  const midY = round2((stripTop + stripBot) / 2);

  // fold size from the max |deviation| across folds
  const devs = values.filter(isFiniteValue).map((v) => Math.abs(v - baseline));
  const dataDev = extent(devs)?.[1] ?? 1;
  const domainDev =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? Math.max(Math.abs(opts.domain[0] - baseline), Math.abs(opts.domain[1] - baseline))
      : dataDev;
  // Both bounds can be finite and their distance from `baseline` still overflow
  // — `domain={[-1e308, 1e308]}` against a far-off baseline is Infinity — and an
  // infinite foldSize makes fold 1's floor `0 * Infinity`, i.e. NaN. Every band
  // coordinate then came out NaN, browsers drop an invalid path, and the strip
  // went blank while the summary kept announcing a real trend. Fall back to the
  // data's own extent, same as an omitted domain. (`extent` skips non-finite
  // deviations, so `dataDev` is always a usable number.)
  const foldSize = Math.max((Number.isFinite(domainDev) ? domainDev : dataDev) / folds, 1e-9);

  const xFor = (i: number) => round2(n > 1 ? pad + (i * (width - pad * 2)) / (n - 1) : width / 2);

  const bands: HorizonBand[] = [];
  // Both modes walk both signs; only the y mapping below differs.
  for (const sign of [1, -1] as const) {
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
    // Saturate at the top fold, exactly where the band generator's
    // `Math.min(dev, hi)` does — the modulo wrapped past it into a fold that is
    // never drawn (the loop is bounded by `folds`), so a value one epsilon over
    // the ceiling teleported the dot from the strip top to the strip bottom
    // while the band under it stayed saturated.
    const ceil = folds * foldSize;
    const frac = dev >= ceil ? 1 : (dev % foldSize) / foldSize || (dev > 0 ? 1 : 0);
    if (mode === "mirror") return round2(stripBot - frac * (stripBot - stripTop));
    return v - baseline >= 0
      ? round2(midY - frac * (midY - stripTop))
      : round2(midY + frac * (stripBot - midY));
  };

  return { bands, opacities: OPACITY[folds], xFor, foldedY, y0: stripTop, y1: stripBot, n };
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
