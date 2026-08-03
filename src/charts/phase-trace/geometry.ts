// PhaseTrace: Two
// synchronized signals become an x×y trajectory; path order carries time and the
// current state is a directed endpoint. Axes/domains are named and stated and
// ALWAYS linear (no log option). Time direction stays recoverable via the
// muted-trail + accent-tail + arrowhead trio. 2-dp.
import { clamp } from "../../core/scale.js";
import { chartSide, isFiniteValue, round2 } from "../../core/types.js";

/** An x×y observation (two synchronized signals at one instant). */
export interface Pt {
  x: number;
  y: number;
}

export type Heading = 0 | 1 | 2 | 3 | 4; // up-right, up-left, down-right, down-left, steady

/** Documented defaults — shared by both entries so a rejected prop lands on the
 * same box/tail the props table advertises, not on a second set of numbers. */
export const DEFAULT_WIDTH = 40;
export const DEFAULT_HEIGHT = 32;
export const DEFAULT_TAIL = 0.25;

interface PhasePoint {
  x: number;
  y: number;
  dataX: number;
  dataY: number;
}

export interface PhaseTraceResult {
  trailPath: string;
  tailPath: string;
  end: { x: number; y: number } | null;
  arrow: string;
  start: { x: number; y: number } | null;
  heading: Heading;
  points: PhasePoint[];
  /** Plot-box top edge (viewBox units) — the yDomain's max. */
  y0: number;
  /** Plot-box bottom edge (viewBox units) — the yDomain's min. */
  y1: number;
}

/**
 * A caller domain that can actually carry a linear scale, or `null`.
 *
 * Rejects three shapes that all paint NaN coordinates under a perfectly normal
 * accessible name: a non-finite end (`[0, NaN]` silently became a span of 1 and
 * threw the trace 2200 units off a 40-unit box), a span that overflows to
 * Infinity (`Infinity / Infinity` is NaN — the failure `scaleLinear` documents,
 * and reachable from real data at ±1e308, not just from a hostile prop), and a
 * zero span, which has no direction to project.
 *
 * The pair is ORDERED rather than honoured as an inverted axis: `heading` is
 * read in data space, where up means increasing y, so a flipped y-axis would
 * announce "up-right" over a mark that visibly went down.
 */
function usableDomain(d: readonly [number, number] | undefined): [number, number] | null {
  if (!d) return null;
  const [a, b] = d;
  if (!isFiniteValue(a) || !isFiniteValue(b)) return null;
  const lo = a < b ? a : b;
  const hi = a < b ? b : a;
  return hi > lo && Number.isFinite(hi - lo) ? [lo, hi] : null;
}

/** The fitted extent — the documented default whenever `domain` is absent or unusable. */
function fittedDomain(pts: readonly Pt[], axis: "x" | "y"): [number, number] | null {
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of pts) {
    const v = p[axis];
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (!Number.isFinite(lo)) return null;
  // A flat series gets a band to sit in; anything wider still has to survive
  // the span check (±1e308 data fits in no finite span).
  return lo === hi ? [lo - 1, hi + 1] : usableDomain([lo, hi]);
}

export function phaseTraceGeometry(opts: {
  data: readonly Pt[];
  xDomain?: readonly [number, number] | undefined;
  yDomain?: readonly [number, number] | undefined;
  tail: number;
  width: number;
  height: number;
}): PhaseTraceResult {
  const { data, tail } = opts;
  // `Chart` clamps the FRAME with chartSide; geometry laying marks out against
  // the raw prop is how NaN coordinates end up inside a valid viewBox (and how
  // `width={0}` painted the trace two units left of the box).
  const width = chartSide(opts.width, DEFAULT_WIDTH);
  const height = chartSide(opts.height, DEFAULT_HEIGHT);
  const pad = 2;
  const plotY0 = pad;
  const plotY1 = round2(height - pad);

  // finite + dedup consecutive coincident points
  const pts: Pt[] = [];
  for (const p of data) {
    if (!isFiniteValue(p.x) || !isFiniteValue(p.y)) continue;
    const prev = pts[pts.length - 1];
    if (prev && prev.x === p.x && prev.y === p.y) continue;
    pts.push({ x: p.x, y: p.y });
  }
  if (pts.length === 0) {
    return {
      trailPath: "",
      tailPath: "",
      end: null,
      arrow: "",
      start: null,
      heading: 4,
      points: [],
      y0: plotY0,
      y1: plotY1,
    };
  }

  const xd = usableDomain(opts.xDomain) ?? fittedDomain(pts, "x");
  const yd = usableDomain(opts.yDomain) ?? fittedDomain(pts, "y");
  // No projectable domain left (every reading at ±1e308): centre the axis, the
  // same answer `scaleLinear` gives a degenerate domain — never an edge, never NaN.
  const xOf = xd
    ? (v: number): number =>
        round2(pad + ((clamp(v, xd[0], xd[1]) - xd[0]) / (xd[1] - xd[0])) * (width - pad * 2))
    : (): number => round2(width / 2);
  const yOf = yd
    ? (v: number): number =>
        round2(pad + (1 - (clamp(v, yd[0], yd[1]) - yd[0]) / (yd[1] - yd[0])) * (height - pad * 2))
    : (): number => round2(height / 2);

  const screen = pts.map((p) => ({ x: xOf(p.x), y: yOf(p.y) }));
  const points: PhasePoint[] = pts.map((p, i) => ({
    x: screen[i]!.x,
    y: screen[i]!.y,
    dataX: p.x,
    dataY: p.y,
  }));
  const n = screen.length;
  // A non-finite `tail` used to fall through as NaN, which sliced the WHOLE
  // trajectory into the accent tail while the heading loop never ran — the
  // chart painted a rising trace and announced "steady".
  const t = isFiniteValue(tail) ? clamp(tail, 0, 1) : DEFAULT_TAIL;
  const tailStart = Math.max(0, Math.floor((1 - t) * (n - 1)));

  const toPath = (from: number, to: number): string =>
    to <= from
      ? ""
      : screen
          .slice(from, to + 1)
          .map((s, i) => `${i === 0 ? "M" : "L"}${s.x} ${s.y}`)
          .join("");

  const trailPath = toPath(0, tailStart);
  const tailPath = toPath(tailStart, n - 1);
  const end = screen[n - 1]!;
  const start = screen[0]!;

  // heading from the mean delta over the tail (data space)
  let dx = 0;
  let dy = 0;
  for (let i = tailStart + 1; i < n; i++) {
    dx += pts[i]!.x - pts[i - 1]!.x;
    dy += pts[i]!.y - pts[i - 1]!.y;
  }
  const eps = ((xd ? xd[1] - xd[0] : 0) + (yd ? yd[1] - yd[0] : 0)) * 0.005;
  let heading: Heading;
  if (Math.abs(dx) < eps && Math.abs(dy) < eps) heading = 4;
  else if (dy >= 0) heading = dx >= 0 ? 0 : 1;
  else heading = dx >= 0 ? 2 : 3;

  // arrowhead along the final screen segment
  let arrow = "";
  if (n >= 2) {
    const a = screen[n - 2]!;
    const ang = Math.atan2(end.y - a.y, end.x - a.x);
    // The barbs reach 0.87·L BEHIND the endpoint, so a trace ending at the plot
    // edge used to paint its arrowhead outside the viewBox. Clamp the barbs
    // into the plot box — identity when they fit, shortened (never redirected
    // the wrong way) when the box boundary is closer than L.
    const L = Math.min(width, height) * 0.12;
    const inPlot = (x: number, y: number): { x: number; y: number } => ({
      x: round2(Math.min(Math.max(x, pad), width - pad)),
      y: round2(Math.min(Math.max(y, pad), height - pad)),
    });
    const a1 = inPlot(
      end.x + Math.cos(ang + (150 * Math.PI) / 180) * L,
      end.y + Math.sin(ang + (150 * Math.PI) / 180) * L,
    );
    const a2 = inPlot(
      end.x + Math.cos(ang - (150 * Math.PI) / 180) * L,
      end.y + Math.sin(ang - (150 * Math.PI) / 180) * L,
    );
    arrow = `M${end.x} ${end.y}L${a1.x} ${a1.y}M${end.x} ${end.y}L${a2.x} ${a2.y}`;
  }

  return { trailPath, tailPath, end, arrow, start, heading, points, y0: plotY0, y1: plotY1 };
}
