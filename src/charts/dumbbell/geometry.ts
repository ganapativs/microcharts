// Dumbbell geometry — pure, React-free. Two dot
// positions + connecting span per row on one shared scale. Direction is
// shape-coded (hollow from → filled to), never color-alone. Coords 2-dp.
import { clamp, extent, scaleLinear } from "../../core/scale.js";
import { round2 } from "../../core/types.js";
import { textGutter } from "../../core/labels.js";

interface DumbbellRow {
  y: number;
  x0: number | null;
  x1: number | null;
  dir: 1 | -1 | 0;
  index: number;
}

export interface DumbbellGeometry {
  rows: DumbbellRow[];
  labelX: number;
  pitch: number;
  /** Plot x-range after the label gutter. */
  plotX0: number;
  plotX1: number;
}

export function dumbbellGeometry(opts: {
  width: number;
  height: number;
  pairs: readonly { from: number; to: number }[];
  domain?: readonly [number, number] | undefined;
  gutterCh: number;
  fontSize: number;
}): DumbbellGeometry {
  const { width, height, pairs, gutterCh, fontSize } = opts;
  const r = 2;
  const gutter = gutterCh > 0 ? textGutter(gutterCh, fontSize, 3) : 0;
  const plotX0 = gutter + r;
  const plotX1 = width - r;

  const all = pairs.flatMap((p) => [p.from, p.to]);
  let domain =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? opts.domain
      : (extent(all) ?? [0, 1]);
  if (domain[0] === domain[1]) domain = [domain[0] - 1, domain[1] + 1];
  const scale = scaleLinear(domain, [plotX0, plotX1]);

  const pitch = pairs.length > 0 ? height / pairs.length : 0;
  const rows: DumbbellRow[] = pairs.map((p, i) => {
    const okFrom = Number.isFinite(p.from);
    const okTo = Number.isFinite(p.to);
    return {
      y: round2(clamp(pitch * (i + 0.5), r, height - r)),
      x0: okFrom ? round2(clamp(scale(p.from), plotX0, plotX1)) : null,
      x1: okTo ? round2(clamp(scale(p.to), plotX0, plotX1)) : null,
      dir: !okFrom || !okTo ? 0 : p.to > p.from ? 1 : p.to < p.from ? -1 : 0,
      index: i,
    };
  });

  return { rows, labelX: gutter > 0 ? gutter - 3 : 0, pitch, plotX0, plotX1 };
}
