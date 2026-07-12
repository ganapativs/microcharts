// HeatCell geometry — pure, React-free. One calibrated color
// step for one value against a known scale. Discrete steps only: continuous
// opacity is a false-precision channel at 12 px. All metrics 2-dp.
import { clamp } from "../../core/scale.js";
import { round2 } from "../../core/types.js";
import { cellMetrics, stepIndex, type CellShape } from "../../shared/cell.js";

export interface HeatCellGeometry {
  x: number;
  y: number;
  w: number;
  h: number;
  rx: number;
  /** 0-based step bin, or null when the value is not plottable. */
  step: number | null;
  /** Clamped normalized value in [0, 1] (0.5 for a zero-width domain). */
  t: number;
  crisp: boolean;
  /** Whether a centered value label fits (deterministic char estimate). */
  labelFits: (chars: number, fontSize: number) => boolean;
}

export function heatCellGeometry(opts: {
  width: number;
  height: number;
  value: number;
  domain: readonly [number, number];
  steps: number;
  shape: CellShape;
}): HeatCellGeometry {
  const { width, height, value, domain, steps, shape } = opts;
  const size = Math.min(width, height);
  const m = cellMetrics(size, shape);

  const [d0, d1] = domain;
  const span = d1 - d0;
  const finite = Number.isFinite(value) && Number.isFinite(d0) && Number.isFinite(d1);
  // zero-width domain → single mid step (caller dev-warns); binning shared
  // with HeatStrip via shared/cell.stepIndex — one calibration everywhere
  const t = !finite ? 0 : span === 0 ? 0.5 : round2(clamp((value - d0) / span, 0, 1));
  const step = !finite ? null : stepIndex(value, d0, d1, steps);

  return {
    x: round2((width - size) / 2 + m.inset),
    y: round2((height - size) / 2 + m.inset),
    w: round2(size - m.inset * 2),
    h: round2(size - m.inset * 2),
    rx: m.rx,
    step,
    t,
    crisp: m.crisp,
    labelFits: (chars, fontSize) => chars * fontSize * 0.62 <= width - 1,
  };
}
