// Dumbbell: Two dot
// positions + connecting span per row on one shared scale. Direction is
// shape-coded (hollow from → filled to). never color-alone. Coords 2-dp.
import { clamp, extent, scaleLinear } from "../../core/scale.js";
import { round2 } from "../../core/types.js";
import { ROW_LABEL_WIDTH_SHARE_WIDE, rowLabelChars, textGutterProse } from "../../core/labels.js";

/** Dot radius — the plot insets by one at each end, and the gutter guard below
 *  measures the leftover plot in these units. */
const R = 2;

/**
 * Row-name character budget for the left gutter, and the one place the decision
 * to DROP the names lives. Both entries reserve this gutter — the static
 * component to place its marks, the interactive one to place its overlay rings —
 * and they had drifted: only the static path dropped the names under a crowded
 * pitch, so on a short box the client reserved a 56-unit gutter the painted chart
 * never had and every focus ring landed a gutter's width off its dot.
 *
 * Pure arithmetic: the static path may never measure text.
 */
export function dumbbellLabelChars(opts: {
  width: number;
  height: number;
  rows: number;
  fontSize: number;
  /** Longest row name in characters; 0 = no row is named. */
  longest: number;
}): number {
  const { width, height, rows, fontSize, longest } = opts;
  if (longest <= 0 || rows <= 0) return 0;
  // Rows share the height evenly, so the row pitch IS the vertical room a row
  // name gets. Once the pitch drops under a line of text the names stack on each
  // other — the "Paris/Berlin/Rome in a tab header" failure. They drop instead,
  // all together (the pitch is uniform, so it is never a partial decision), and
  // the gutter drops with them so the paired dots reclaim the full width.
  if (height / rows < fontSize + 0.5) return 0;
  // One shared policy for every row-label chart (core/labels): the same width
  // share, the same cap, and the same rule that a truncation too short to
  // identify anything is DROPPED rather than painted. This used to keep 4
  // characters, which is "San …" — indistinguishable from "San J…".
  const chars = rowLabelChars(width * ROW_LABEL_WIDTH_SHARE_WIDE, fontSize, longest, 3);
  if (chars === 0) return 0;
  // The 4-char floor is a legibility minimum, not evidence the box can pay it. At
  // width 20 it reserved a 37-unit gutter inside a 20-unit box: plotX0 landed
  // past plotX1 and both dots, the connector and the name painted outside the
  // viewBox. `.mc-root` is overflow: visible, so that spills into the page rather
  // than clipping. A gutter that leaves no room for the pair loses to the pair.
  return textGutterProse(chars + 1, fontSize, 3) + R <= width - R - 2 * R ? chars : 0;
}

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
  const r = R;
  // Caller-supplied row label, not a figure we formatted — see textGutterProse.
  const gutter = gutterCh > 0 ? textGutterProse(gutterCh, fontSize, 3) : 0;
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
