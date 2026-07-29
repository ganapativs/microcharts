// HeatCell: One calibrated color
// step for one value against a known scale. Discrete steps only: continuous
// opacity is a false-precision channel at 12 px. All metrics 2-dp.
import { clamp } from "../../core/scale.js";
import { round2 } from "../../core/types.js";
import { cellMetrics, stepIndex, type CellShape } from "../../shared/cell.js";

/** In-cell numeral size in viewBox units. Lives here because BOTH entries need
 *  the same answer to "does the number fit?" — see `labelFits`. */
export const HEAT_CELL_LABEL_SIZE = 7;

export interface HeatCellGeometry {
  x: number;
  y: number;
  w: number;
  h: number;
  rx: number;
  /** 0-based step bin, or null when the value is not plottable. */
  step: number | null;
  /** The resolved bin count `step` was binned against. Announce and paint from
   *  THIS, never the raw prop — see `resolveSteps`. */
  steps: number;
  /** Clamped normalized value in [0, 1] (0.5 for a zero-width domain). */
  t: number;
  crisp: boolean;
  /** Whether a centered value label fits (deterministic char estimate). */
  labelFits: (chars: number, fontSize: number) => boolean;
}

/** `steps` is a bin COUNT a host computes rather than types — `Number(field)` on
 *  an empty input is NaN, `bins / groups` with no groups is Infinity, and a
 *  derived one arrives fractional. Each of those used to reach the accessible
 *  name verbatim ("42 — level NaN of NaN.", "level 2 of 2.5") and the ramp
 *  (`--mc-cell-mix: NaN`, an invalid declaration that drops a real value back to
 *  the uncalibrated fill). Repair once, here, so the announced scale and the
 *  painted scale are the same scale. 1 stays 1: `stepIndex` and
 *  `valueStepMixPct` both handle the single-bin case on purpose. */
function resolveSteps(raw: number): number {
  return Number.isFinite(raw) && raw >= 1 ? Math.round(raw) : 5;
}

export function heatCellGeometry(opts: {
  width: number;
  height: number;
  value: number;
  domain: readonly [number, number];
  steps: number;
  shape: CellShape;
}): HeatCellGeometry {
  const { width, height, value, domain, shape } = opts;
  const size = Math.min(width, height);
  const m = cellMetrics(size, shape);
  const steps = resolveSteps(opts.steps);

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
    steps,
    t,
    crisp: m.crisp,
    labelFits: (chars, fontSize) => chars * fontSize * 0.62 <= width - 1,
  };
}
