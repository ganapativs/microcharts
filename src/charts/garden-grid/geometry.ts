// GardenGrid geometry — pure, React-free. ActivityGrid's
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
  const rows = Math.max(1, opts.rows);
  const { cell, gap, pad } = opts;
  const steps = Math.max(2, opts.steps);
  const stepPx = cell + gap;
  const rMax = round2(cell / 2);

  const data = opts.values;
  const n = data.length;
  const cols = n === 0 ? 0 : Math.ceil(n / rows);
  const width = Math.max(1, cols > 0 ? cols * stepPx - gap + 2 * pad : 1);
  const height = Math.max(1, rows > 0 ? rows * stepPx - gap + 2 * pad : 1);

  const e = opts.domain ?? extent(data);
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

  return { cells, cols, rows, width, height, rMax };
}
