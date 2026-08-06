// QuadrantDot: Where does this item
// sit in the 2×2, against the field? A focal dot placed by 2-D position, a
// hairline cross at the split (default = domain midpoints, always overridable
// but never hidden). and tiny muted ghost dots for the peer field. The read is
// quadrant MEMBERSHIP first; exact position second. Boundary rule: ≥ split ⇒
// right/top (deterministic). Glyph scale (24×24). Coords 2-dp.
import { clamp, scaleLinear, extent } from "../../core/scale.js";
import { chartSide, round2 } from "../../core/types.js";

export const DEFAULT_WIDTH = 24;
export const DEFAULT_HEIGHT = 24;

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
 *
 * `halo` is the outermost mark (the focal's soft disc, and the focus/selection
 * ring drawn on top of it), so it is what the plot has to be inset by — which
 * makes the rim around the focal a tax on the plot, paid twice per axis. A flat
 * 1.4 units of rim was that tax read at 56 units and charged at every size: the
 * 24-unit default spent 3.8 of every 12 on the inset and plotted the field into
 * 68% of its own box. The rim is now 30% of the focal it wraps, so it costs the
 * plot the same fraction at every size, and it still stops at the 1.4 it always
 * was (unchanged at 47 units and up, where it was already proportionate).
 */
export function quadrantDotRadii(
  width: number,
  height: number,
): { focal: number; ghost: number; halo: number } {
  const w = chartSide(width, DEFAULT_WIDTH);
  const h = chartSide(height, DEFAULT_HEIGHT);
  // 2-dp like every other emitted coordinate: unrounded these reached the `r`
  // attribute as `2.4000000000000004`, and the plot inset derived from `halo`
  // then missed the frame by a float's width.
  const focal = round2(Math.max(1.6, Math.min(w, h) * 0.1));
  return {
    focal,
    ghost: round2(Math.max(1, focal * 0.52)),
    halo: round2(focal + Math.min(1.4, focal * 0.3)),
  };
}

/**
 * Domain from a caller prop, or the data extent. A single NaN/±Infinity in the
 * tuple (`Math.min(...)` over a series holding a null, a domain read from an
 * empty input) used to reach `scaleLinear`, which degenerates to the range
 * midpoint — every dot stacked on the split line — while the accessible name
 * went on naming a quadrant and a peer count from the raw values. Announced
 * scale and painted scale have to be the same scale.
 */
function resolveDomain(
  prop: readonly [number, number] | undefined,
  values: readonly number[],
  fallback: number,
): readonly [number, number] {
  if (prop && prop.every((d) => Number.isFinite(d))) return prop;
  return extent(values) ?? [fallback, fallback];
}

/** Split from a caller prop, or the domain midpoint — the documented default. */
function resolveSplit(prop: number | undefined, d: readonly [number, number]): number {
  if (Number.isFinite(prop)) return prop as number;
  const mid = (d[0] + d[1]) / 2;
  // A domain wide enough to overflow (±1e308) makes its own midpoint infinite,
  // which paints the cross at `Infinity` inside a valid viewBox.
  return Number.isFinite(mid) ? mid : d[0];
}

export function quadrantDotGeometry(opts: {
  width: number;
  height: number;
  data: Pt;
  field?: readonly Pt[] | undefined;
  xDomain?: readonly [number, number] | undefined;
  domain?: readonly [number, number] | undefined;
  split?: readonly [number, number] | undefined;
  /** Extra plot inset, added to the halo the marks already need. */
  pad?: number | undefined;
}): QuadrantDotGeometry | null {
  const { data } = opts;
  if (!finite(data)) return null;

  const width = chartSide(opts.width, DEFAULT_WIDTH);
  const height = chartSide(opts.height, DEFAULT_HEIGHT);
  const field = (opts.field ?? []).filter(finite);

  // The plot is inset by the widest mark: the focal's halo scales with the box,
  // so at 120 px a focal on the domain edge painted ~10 units of accent OUTSIDE
  // the viewBox — `.mc-root` is `overflow: visible`, so that is a spill over
  // neighbouring text, not a clip. The inset is now exactly that radius and no
  // more; the flat 3 units it used to floor at bought nothing the halo was not
  // already reserving, and below a 30-unit box it was pure margin (an 8-unit
  // glyph plotted its field into 2 of its 8 units). `pad` adds to the floor, it
  // cannot go under it: less than the halo is a mark painting off the frame.
  // Capped at half the box so a mark wider than its own frame collapses to the
  // centre instead of inverting the range.
  const { halo } = quadrantDotRadii(width, height);
  const pad = Math.max(opts.pad ?? 0, halo);
  const padX = Math.min(pad, width / 2);
  const padY = Math.min(pad, height / 2);

  const xs = [data.x, ...field.map((p) => p.x)];
  const ys = [data.y, ...field.map((p) => p.y)];
  const xd = resolveDomain(opts.xDomain, xs, data.x);
  const yd = resolveDomain(opts.domain, ys, data.y);
  const xDegenerate = xd[0] === xd[1];
  const yDegenerate = yd[0] === yd[1];

  const sx = scaleLinear(xd, [padX, width - padX]);
  const sy = scaleLinear(yd, [height - padY, padY]); // y up
  // Out-of-domain points (a caller's fixed domain, a peer past it) project
  // outside the box; the mark belongs on the edge it ran off, never past it.
  const projX = (v: number): number => round2(clamp(sx(v), padX, width - padX));
  const projY = (v: number): number => round2(clamp(sy(v), padY, height - padY));

  const splitX = resolveSplit(opts.split?.[0], xd);
  const splitY = resolveSplit(opts.split?.[1], yd);

  // boundary rule: ≥ split ⇒ right (x) / top (y)
  const xHigh = data.x >= splitX;
  const yHigh = data.y >= splitY;
  // TL=0, TR=1, BL=2, BR=3
  const quadrant: 0 | 1 | 2 | 3 = yHigh ? (xHigh ? 1 : 0) : xHigh ? 3 : 2;

  // Clamped to the box, not the plot inset: a split outside the domain means
  // the whole field sits on one side, and the cross says so by sitting on the
  // frame. Unclamped it drew a hairline (and a tint rect) metres wide.
  const crossX = xDegenerate ? null : round2(clamp(sx(splitX), 0, width));
  const crossY = yDegenerate ? null : round2(clamp(sy(splitY), 0, height));

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
      x: projX(p.x),
      y: projY(p.y),
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
    dot: { x: projX(data.x), y: projY(data.y), vx: data.x, vy: data.y },
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
