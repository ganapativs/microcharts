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
}

export const HEAT_STRIP_MAX_CELLS = 60;

export function heatStripGeometry(opts: {
  width: number;
  height: number;
  values: readonly Value[];
  domain?: readonly [number, number] | undefined;
  steps: number;
  gap?: number | undefined;
  shape: CellShape;
}): HeatStripGeometry {
  const { width, height, steps, shape } = opts;

  const downsampled = opts.values.length > HEAT_STRIP_MAX_CELLS;
  const values = downsampled
    ? maxPerBucket(opts.values, HEAT_STRIP_MAX_CELLS)
    : opts.values.map((v) => (isFiniteValue(v) ? v : null));

  const n = values.length;
  if (n === 0) return { cells: [], crisp: shape === "square", downsampled, pitch: 0 };

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
  const y = round2((height - size) / 2 + m.inset);
  const pitch = cellW + gap;

  const cells: HeatStripCell[] = values.map((v, i) => {
    // round x FIRST, then clamp the width to what remains — 2-dp rounding can
    // never push the last cell past the strip (same rule as progress slots)
    const x = round2(i * pitch + m.inset);
    return {
      x,
      y,
      w: round2(Math.min(cellW - m.inset * 2, round2(width - x))),
      h: round2(size - m.inset * 2),
      rx: m.rx,
      step: v === null ? null : stepIndex(v, domain[0], domain[1], steps),
      value: v,
      index: i,
    };
  });

  return { cells, crisp: m.crisp, downsampled, pitch };
}
