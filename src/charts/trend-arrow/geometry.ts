// TrendArrow geometry — pure, React-free (plan/22 #1, S4). Direction glyphs as
// precomputed unit polygons scaled into the box, 2-dp. The glyph never scales
// with magnitude (an arrow twice as long is a lie at this precision); only its
// orientation encodes. Flat is one shared shape across glyph families — "no
// real change" reads identically everywhere.
import { round2 } from "../../core/types.js";

export type TrendDirection = "up" | "down" | "flat";
export type TrendGlyph = "arrow" | "triangle" | "chevron";

type Poly = readonly (readonly [number, number])[];

// Unit shapes in a 16×16 box, y-down. Up shapes only; down = vertical flip.
// arrow: shaft + head (default legibility at 8 px and in forced-colors);
// triangle: solid mark for dense table columns; chevron: lightest inline weight.
const UP: Record<Exclude<TrendGlyph, never>, Poly> = {
  arrow: [
    [8, 2],
    [13.2, 8.4],
    [10, 8.4],
    [10, 14],
    [6, 14],
    [6, 8.4],
    [2.8, 8.4],
  ],
  triangle: [
    [8, 2.6],
    [14, 13.4],
    [2, 13.4],
  ],
  chevron: [
    [2.2, 9.9],
    [8, 4],
    [13.8, 9.9],
    [12, 11.9],
    [8, 7.9],
    [4, 11.9],
  ],
};

// One flat shape for every family: a centered horizontal bar (▬).
const FLAT: Poly = [
  [2.6, 6.8],
  [13.4, 6.8],
  [13.4, 9.2],
  [2.6, 9.2],
];

const BOX = 16;

function toPath(points: Poly, scale: number, ox: number, oy: number, flipY: boolean): string {
  const cmds = points.map(([x, y], i) => {
    const yy = flipY ? BOX - y : y;
    return `${i === 0 ? "M" : "L"}${round2(ox + x * scale)} ${round2(oy + yy * scale)}`;
  });
  return `${cmds.join(" ")} Z`;
}

export interface TrendArrowGeometry {
  /** Filled glyph path. */
  d: string;
  /** Anchor for the optional value text (`text-anchor="start"`). */
  labelX: number;
  /** Baseline y, centered on the glyph midline, clamped by font ascent. */
  labelY: number;
  /** Font size for the value text, in viewBox units (plan/18). */
  fontSize: number;
}

export function trendArrowGeometry(opts: {
  width: number;
  height: number;
  direction: TrendDirection;
  glyph: TrendGlyph;
}): TrendArrowGeometry {
  const { width, height, direction, glyph } = opts;
  // Glyph fills the largest centered square; never stretched (orientation is
  // the encoding — a squashed arrow reads as a different direction strength).
  const scale = Math.min(width, height) / BOX;
  const ox = 0;
  const oy = (height - BOX * scale) / 2;

  const d =
    direction === "flat"
      ? toPath(FLAT, scale, ox, oy, false)
      : toPath(UP[glyph], scale, ox, oy, direction === "down");

  const fontSize = Math.max(6, Math.min(round2(height * 0.5), 11));
  // Baseline sits so digits center optically on the glyph; clamp inside the box.
  const labelY = round2(Math.min(height - 1, height / 2 + fontSize * 0.35));
  const labelX = round2(BOX * scale + ox + 2);

  return { d, labelX, labelY, fontSize };
}
