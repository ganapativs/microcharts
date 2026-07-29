// CoverageStrip: The
// chart is the distinction between `null` (no measurement) and `0` (a measured
// zero): measured cells are filled, gaps are hollow (shape cue, survives
// forced-colors). `expected` lets trailing missingness count — an array that
// simply stops is the worst gap of all. Coords 2-dp.
import { extent } from "../../core/scale.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";
import { cellMetrics, stepIndex, type CellShape } from "../../shared/cell.js";
import { textGutter } from "../../core/labels.js";

interface CoverageCell {
  x: number;
  y: number;
  w: number;
  h: number;
  rx: number;
  present: boolean;
  value: number | null;
  /** 0-based intensity step (mode="intensity", measured cells only), else null. */
  step: number | null;
  index: number;
}

export interface CoverageStripGeometry {
  cells: CoverageCell[];
  /** measured / expected, 0–1, 2-dp. */
  coverage: number;
  measured: number;
  /** Whole slot count the cells were laid out and the summary counted against.
   *  Callers must read THIS, never the raw `expected` opt — see `resolveCount`. */
  expected: number;
  /** Whole step count the cells were binned against — paint the ramp from this,
   *  never from the raw `steps` opt (same reason as `expected`). */
  steps: number;
  /** Longest run of missing slots, including any trailing shortfall vs expected. */
  longestGap: number;
  crisp: boolean;
  /** Slot pitch for interactive x-band lookup. */
  pitch: number;
  labelX: number;
  labelY: number;
  totalWidth: number;
}

export const COVERAGE_MAX_SLOTS = 120;

/** `expected` and `steps` are counts a host computes rather than types:
 *  `expected={hours / bucket}` with `bucket` momentarily 0 is `Infinity`, and
 *  `Number(field.value)` on a cleared input is `NaN`. Both used to flow through
 *  raw: `expected={NaN}` ran the slot loop zero times, so a strip holding six
 *  real readings drew nothing and announced "No data."; `expected={7.5}` drew 8
 *  cells and announced "4 of 7.5 slots"; a non-finite `steps` binned every
 *  intensity cell to `fill-opacity="NaN"`. Repair once, here, so the summary
 *  counts the slots that were actually drawn. */
function resolveCount(raw: number | undefined, fallback: number, min: number): number {
  return raw !== undefined && Number.isFinite(raw) ? Math.max(min, Math.round(raw)) : fallback;
}

export function coverageGeometry(opts: {
  width: number;
  height: number;
  data: readonly Value[];
  expected?: number | undefined;
  mode?: "binary" | "intensity";
  steps?: number;
  domain?: readonly [number, number] | undefined;
  shape: CellShape;
  gutterCh?: number;
  fontSize?: number;
}): CoverageStripGeometry {
  const { width, height, data, mode = "binary", shape } = opts;
  const steps = resolveCount(opts.steps, 5, 1);
  const gutterCh = opts.gutterCh ?? 0;
  const fontSize = opts.fontSize ?? 0;
  const gutter = gutterCh > 0 ? textGutter(gutterCh, fontSize, 4) : 0;

  // NaN is measured-but-unreadable: present cell, value omitted. null is a gap.
  const slots = data.map((v) => ({
    present: v !== null && v !== undefined,
    value: isFiniteValue(v) ? v : null,
  }));
  const rawExpected = Math.max(resolveCount(opts.expected, slots.length, 0), slots.length);
  const expected = Math.min(rawExpected, COVERAGE_MAX_SLOTS);
  // trailing shortfall renders as gaps
  const cellsIn: { present: boolean; value: number | null }[] = [];
  for (let i = 0; i < expected; i++) cellsIn.push(slots[i] ?? { present: false, value: null });

  const n = cellsIn.length;
  if (n === 0) {
    return {
      cells: [],
      coverage: 0,
      measured: 0,
      expected: 0,
      steps,
      longestGap: 0,
      crisp: shape === "square",
      pitch: 0,
      labelX: width,
      labelY: round2(height / 2),
      totalWidth: width + gutter,
    };
  }

  // flush cells (tiny hairline gap) read as a continuous ruler of slots, so a
  // gap slot is visibly an EMPTY slot, not a void between islands
  const gap = round2(Math.min(0.6, (width / n) * 0.08));
  const cellW = (width - gap * (n - 1)) / n;
  const size = Math.min(cellW, height);
  const m = cellMetrics(size, shape);
  const y = round2((height - size) / 2 + m.inset);
  const pitch = cellW + gap;

  const domain =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? opts.domain
      : (extent(data) ?? [0, 1]);

  let measured = 0;
  let longestGap = 0;
  let run = 0;
  const cells: CoverageCell[] = cellsIn.map((c, i) => {
    if (c.present) {
      measured++;
      run = 0;
    } else {
      run++;
      if (run > longestGap) longestGap = run;
    }
    const x = round2(i * pitch + m.inset);
    return {
      x,
      y,
      w: round2(Math.min(cellW - m.inset * 2, round2(width - x))),
      h: round2(size - m.inset * 2),
      rx: m.rx,
      present: c.present,
      value: c.value,
      step:
        mode === "intensity" && c.present && c.value !== null
          ? stepIndex(c.value, domain[0], domain[1], steps)
          : null,
      index: i,
    };
  });

  return {
    cells,
    coverage: round2(measured / expected),
    measured,
    expected,
    steps,
    longestGap,
    crisp: m.crisp,
    pitch,
    labelX: width + gutter,
    labelY: round2(height / 2),
    totalWidth: width + gutter,
  };
}
