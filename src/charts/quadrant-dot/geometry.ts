// QuadrantDot geometry — pure, React-free. Where does this item
// sit in the 2×2, against the field? A focal dot placed by 2-D position, a
// hairline cross at the split (default = domain midpoints, always overridable
// but never hidden), and tiny muted ghost dots for the peer field. The read is
// quadrant MEMBERSHIP first; exact position second. Boundary rule: ≥ split ⇒
// right/top (deterministic). Glyph scale (24×24). Coords 2-dp.
import { scaleLinear, extent } from "../../core/scale.js";
import { round2 } from "../../core/types.js";

interface Pt {
  x: number;
  y: number;
}

export interface QuadrantDotGeometry {
  /** Split cross in px; `x`/`y` null when that axis is degenerate (line hidden). */
  cross: { x: number | null; y: number | null };
  /** Focal in px (`x`,`y`) plus its raw data values (`vx`,`vy`). */
  dot: { x: number; y: number; vx: number; vy: number };
  /** Peers in px + raw values + quadrant, sorted nearest-first from the focal.
   *  Interactive index 0 is the focal; peers are 1…n in this order. */
  ghosts: { x: number; y: number; vx: number; vy: number; quadrant: 0 | 1 | 2 | 3 }[];
  /** TL=0, TR=1, BL=2, BR=3. */
  quadrant: 0 | 1 | 2 | 3;
  /** Focal above/right of split? (drives quadrant naming & the tint rect.) */
  xHigh: boolean;
  yHigh: boolean;
  /** The tinted region rect (focal's quadrant). */
  region: { x: number; y: number; width: number; height: number };
  peersInQuadrant: number;
  fieldCount: number;
  xDegenerate: boolean;
  yDegenerate: boolean;
}

const finite = (p: Pt): boolean => Number.isFinite(p.x) && Number.isFinite(p.y);

/**
 * Mark radii — proportional to the box, so they must not be re-derived by the
 * interactive entry: its hit radius is sized from the PAINTED ghost, and a
 * fixed one leaves the outer ring of a large dot dead to the pointer.
 */
export function quadrantDotRadii(width: number, height: number): { focal: number; ghost: number } {
  const focal = Math.max(1.6, Math.min(width, height) * 0.1);
  return { focal, ghost: Math.max(1, focal * 0.52) };
}

export function quadrantDotGeometry(opts: {
  width: number;
  height: number;
  data: Pt;
  field?: readonly Pt[] | undefined;
  xDomain?: readonly [number, number] | undefined;
  domain?: readonly [number, number] | undefined;
  split?: readonly [number, number] | undefined;
  pad?: number | undefined;
}): QuadrantDotGeometry | null {
  const { width, height, data } = opts;
  if (!finite(data)) return null;

  const pad = opts.pad ?? 3;
  const field = (opts.field ?? []).filter(finite);

  const xs = [data.x, ...field.map((p) => p.x)];
  const ys = [data.y, ...field.map((p) => p.y)];
  const xd = opts.xDomain ?? extent(xs) ?? [data.x, data.x];
  const yd = opts.domain ?? extent(ys) ?? [data.y, data.y];
  const xDegenerate = xd[0] === xd[1];
  const yDegenerate = yd[0] === yd[1];

  const sx = scaleLinear(xd, [pad, width - pad]);
  const sy = scaleLinear(yd, [height - pad, pad]); // y up

  const splitX = opts.split?.[0] ?? (xd[0] + xd[1]) / 2;
  const splitY = opts.split?.[1] ?? (yd[0] + yd[1]) / 2;

  // boundary rule: ≥ split ⇒ right (x) / top (y)
  const xHigh = data.x >= splitX;
  const yHigh = data.y >= splitY;
  // TL=0, TR=1, BL=2, BR=3
  const quadrant: 0 | 1 | 2 | 3 = yHigh ? (xHigh ? 1 : 0) : xHigh ? 3 : 2;

  const crossX = xDegenerate ? null : round2(sx(splitX));
  const crossY = yDegenerate ? null : round2(sy(splitY));

  // tint rect = the focal's quadrant, split by the cross (whole axis if degenerate)
  const cx = crossX ?? width / 2;
  const cy = crossY ?? height / 2;
  const region = {
    x: round2(xHigh ? cx : 0),
    y: round2(yHigh ? 0 : cy),
    width: round2(xHigh ? width - cx : cx),
    height: round2(yHigh ? cy : height - cy),
  };

  const quadOf = (p: Pt): 0 | 1 | 2 | 3 => {
    const px = p.x >= splitX;
    const py = p.y >= splitY;
    return py ? (px ? 1 : 0) : px ? 3 : 2;
  };
  const peersInQuadrant = field.filter((p) => quadOf(p) === quadrant).length;

  // ghosts sorted nearest-first from the focal (the interactive cycles in this order)
  const ghosts = field
    .map((p) => ({
      x: round2(sx(p.x)),
      y: round2(sy(p.y)),
      vx: p.x,
      vy: p.y,
      quadrant: quadOf(p),
      d: (p.x - data.x) ** 2 + (p.y - data.y) ** 2,
    }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 30)
    .map(({ d: _d, ...g }) => g);

  return {
    cross: { x: crossX, y: crossY },
    dot: { x: round2(sx(data.x)), y: round2(sy(data.y)), vx: data.x, vy: data.y },
    ghosts,
    quadrant,
    xHigh,
    yHigh,
    region,
    peersInQuadrant,
    fieldCount: field.length,
    xDegenerate,
    yDegenerate,
  };
}
