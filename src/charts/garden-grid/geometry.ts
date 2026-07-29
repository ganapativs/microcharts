// GardenGrid: ActivityGrid's
// grayscale sibling: dot AREA (not color) carries a 5-step ordinal, so it reads
// in print and monochrome. Radius is √-quantized (r = rMax·√(k/S)) so perceived
// AREA steps evenly — a linear radius map would exaggerate highs quadratically.
// Zero = a hairline ring (present, quiet); null = nothing (missing ≠ zero). 2-dp.
import { extent } from "../../core/scale.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";

interface GardenCell {
  cx: number;
  cy: number;
  /** Fill radius (0 when the value is 0 — rendered as a ring instead). */
  r: number;
  /** Ordinal step 0..S (0 = zero/empty). */
  step: number;
  value: number | null;
  index: number;
  row: number;
  col: number;
}

export interface GardenGridGeometry {
  cells: GardenCell[];
  cols: number;
  rows: number;
  width: number;
  height: number;
  rMax: number;
  /** Radius of the zero ring — `rMax * 0.6`, rounded here so a `cell` like 9
   *  does not emit `r="2.6999999999999997"`. */
  rEmpty: number;
  /** The resolved `cell` / `gap` / `steps` the grid was actually laid out and
   *  bucketed against. Callers must paint and ANNOUNCE from THESE, never from
   *  the raw opts — see `resolve` below for what a raw value can be. */
  cell: number;
  gap: number;
  steps: number;
}

/** A config number the host computes rather than types: `cell={boxPx / weeks}`
 *  with `weeks` momentarily 0 is `Infinity`, and `Number(input.value)` on an
 *  empty field is `NaN`. Both flowed straight into `width`, so the grid emitted
 *  `viewBox="0 0 1 1"` with every dot at `cx="NaN"`; a negative `cell` put dots
 *  at negative coords with a negative `r`, outside the viewBox `.mc-root` does
 *  not clip. Repair once, here, so every caller reads the numbers the cells
 *  were built on. Same guard ActivityGrid applies. */
function resolve(raw: number | undefined, fallback: number, min: number): number {
  return raw !== undefined && Number.isFinite(raw) && raw >= min ? raw : fallback;
}

/** Buckets a value into 0..S. 0 for ≤0; positives fill 1..S. */
function stepOf(value: number, min: number, max: number, steps: number): number {
  if (value <= 0) return 0;
  const lo = Math.max(0, min);
  if (max <= 0 || max === lo) return steps;
  const frac = (value - lo) / (max - lo);
  return Math.min(steps, 1 + Math.floor(frac * (steps - 1e-9)));
}

export function gardenGridGeometry(opts: {
  values: readonly Value[];
  rows: number;
  cell: number;
  gap: number;
  steps: number;
  domain?: readonly [number, number] | undefined;
  pad: number;
}): GardenGridGeometry {
  // Rows are whole grid tracks: a fractional `rows` made `i % rows` fractional,
  // so cells landed off the row pitch they were sized for.
  const rows = Math.floor(resolve(opts.rows, 7, 1));
  const cell = resolve(opts.cell, 10, 0);
  const gap = resolve(opts.gap, 2, 0);
  const pad = resolve(opts.pad, 1, 0);
  // `steps` is a count of discrete bins, so it rounds to a whole number before
  // it is clamped — a fractional one bucketed dots into radii no step of the
  // √-quantized area ramp corresponds to.
  const steps = Math.max(2, Math.round(resolve(opts.steps, 5, 1)));
  const stepPx = cell + gap;
  const rMax = round2(cell / 2);

  const data = opts.values;
  const n = data.length;
  const cols = n === 0 ? 0 : Math.ceil(n / rows);
  const width = Math.max(1, cols > 0 ? cols * stepPx - gap + 2 * pad : 1);
  const height = Math.max(1, rows > 0 ? rows * stepPx - gap + 2 * pad : 1);

  // A caller `domain` has to be validated, not trusted: `[NaN, NaN]` (what
  // `[Math.min(...vals), Math.max(...vals)]` yields when `vals` holds one NaN)
  // made `stepOf` return NaN, so every dot painted `r="0"` — an empty-looking
  // plot under an aria-label still announcing the peak and the active count.
  const e = opts.domain?.every((d) => Number.isFinite(d)) ? opts.domain : extent(data);
  const [min, max] = e ?? [0, 0];

  const cells: GardenCell[] = data.map((v, i) => {
    const col = Math.floor(i / rows);
    const row = i % rows;
    const finite = isFiniteValue(v);
    const step = finite ? stepOf(v, min, max, steps) : -1; // -1 = null (no mark)
    return {
      cx: round2(pad + col * stepPx + cell / 2),
      cy: round2(pad + row * stepPx + cell / 2),
      r: step >= 1 ? round2(rMax * Math.sqrt(step / steps)) : 0,
      step,
      value: finite ? v : null,
      index: i,
      row,
      col,
    };
  });

  return { cells, cols, rows, width, height, rMax, rEmpty: round2(rMax * 0.6), cell, gap, steps };
}
