// CoverageStrip geometry — pure, React-free. The
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
  expected: number;
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
  const { width, height, data, mode = "binary", steps = 5, shape } = opts;
  const gutterCh = opts.gutterCh ?? 0;
  const fontSize = opts.fontSize ?? 0;
  const gutter = gutterCh > 0 ? textGutter(gutterCh, fontSize, 4) : 0;

  // NaN is measured-but-unreadable: present cell, value omitted. null is a gap.
  const slots = data.map((v) => ({
    present: v !== null && v !== undefined,
    value: isFiniteValue(v) ? v : null,
  }));
  const rawExpected = Math.max(opts.expected ?? slots.length, slots.length);
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
    longestGap,
    crisp: m.crisp,
    pitch,
    labelX: width + gutter,
    labelY: round2(height / 2),
    totalWidth: width + gutter,
  };
}
