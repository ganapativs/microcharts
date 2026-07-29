// HeatStrip: Value-by-time as
// calibrated color cells: the 1×N sibling of ActivityGrid, same step scale and
// cell vocabulary as HeatCell. Nulls hold their slot (time alignment survives);
// long series collapse via max-per-bucket ONLY. Coords 2-dp.
import { maxPerBucket } from "../../core/downsample.js";
import { extent } from "../../core/scale.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";
import { cellMetrics, stepIndex, type CellShape } from "../../shared/cell.js";

interface HeatStripCell {
  x: number;
  y: number;
  w: number;
  h: number;
  rx: number;
  /** 0-based step, or null for an empty (no-data) slot. */
  step: number | null;
  value: number | null;
  index: number;
}

export interface HeatStripGeometry {
  cells: HeatStripCell[];
  crisp: boolean;
  downsampled: boolean;
  /** Slot pitch for interactive x-band lookup. */
  pitch: number;
  /** The resolved box and step count the cells were actually built from. The
   *  viewBox, the seat, the paint ramp and the pointer map all read THESE, never
   *  the raw opts — see the two resolvers below for what a raw value can be. */
  width: number;
  height: number;
  steps: number;
}

export const HEAT_STRIP_MAX_CELLS = 60;

/** A box edge a host computes rather than types: `width={box / n}` with `n`
 *  momentarily 0 is `Infinity`, and `Number(field.value)` on an empty input is
 *  `NaN`. Both used to flow straight into the cell coords, so every rect got
 *  `x="NaN"` (or, for a negative edge, coords outside a viewBox `.mc-root` does
 *  not clip) while the accessible name still read perfectly. */
const box = (raw: number, fallback: number): number =>
  Number.isFinite(raw) && raw > 0 ? raw : fallback;

export function heatStripGeometry(opts: {
  width: number;
  height: number;
  values: readonly Value[];
  domain?: readonly [number, number] | undefined;
  steps: number;
  gap?: number | undefined;
  shape: CellShape;
}): HeatStripGeometry {
  const { shape } = opts;
  const width = box(opts.width, 60);
  const height = box(opts.height, 10);
  // `steps` is a count of discrete bins, so it rounds to a whole number and
  // floors at 2 before anything buckets against it. A non-finite one binned
  // every cell to NaN and painted `--mc-cell-mix: NaN`, which invalidates the
  // color-mix and collapses the whole ramp to one flat fill; a fractional one
  // produced half-bins no rung of the ramp corresponds to. Same clamp as
  // ActivityGrid and CalendarStrip.
  const steps = Number.isFinite(opts.steps) ? Math.max(2, Math.round(opts.steps)) : 5;

  const downsampled = opts.values.length > HEAT_STRIP_MAX_CELLS;
  const values = downsampled
    ? maxPerBucket(opts.values, HEAT_STRIP_MAX_CELLS)
    : opts.values.map((v) => (isFiniteValue(v) ? v : null));

  const n = values.length;
  if (n === 0) {
    return { cells: [], crisp: shape === "square", downsampled, pitch: 0, width, height, steps };
  }

  // gap adapts to density: 1 unit for roomy strips, shrinking so dense strips
  // keep ≥ ~80% ink (30 one-unit cells with one-unit gaps read as dust)
  const gap = opts.gap ?? round2(Math.min(1, (width / n) * 0.2));

  const domain =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? opts.domain
      : (extent(values) ?? [0, 1]);

  const cellW = (width - gap * (n - 1)) / n;
  const size = Math.min(cellW, height);
  const m = cellMetrics(size, shape);
  // A dot's 0.5-unit padding floor (shared/cell) assumes a cell several units
  // wide. 60 cells in a 60-unit strip are 0.8 units each, so the padding ate the
  // whole mark and every rect got a NEGATIVE width — an SVG error, so the strip
  // painted nothing at all. Half the slot is always ink.
  const inset = Math.min(m.inset, size / 4);
  const drawn = round2(size - inset * 2);
  // a dot stays a circle at the capped padding; square/round radii can't exceed
  // half the mark they round
  const rx = round2(shape === "dot" ? drawn / 2 : Math.min(m.rx, drawn / 2));
  const y = round2((height - size) / 2 + inset);
  const pitch = cellW + gap;

  const cells: HeatStripCell[] = values.map((v, i) => {
    // round x FIRST, then clamp the width to what remains — 2-dp rounding can
    // never push the last cell past the strip (same rule as progress slots)
    const x = round2(i * pitch + inset);
    return {
      x,
      y,
      w: round2(Math.min(cellW - inset * 2, round2(width - x))),
      h: drawn,
      rx,
      step: v === null ? null : stepIndex(v, domain[0], domain[1], steps),
      value: v,
      index: i,
    };
  });

  return { cells, crisp: m.crisp, downsampled, pitch, width, height, steps };
}
