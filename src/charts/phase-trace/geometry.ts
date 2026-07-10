// PhaseTrace geometry — pure, React-free (plan/25 §17, plan/17 F16). Two
// synchronized signals become an x×y trajectory; path order carries time and the
// current state is a directed endpoint. Axes/domains are named and stated and
// ALWAYS linear (no log option). Time direction stays recoverable via the
// muted-trail + accent-tail + arrowhead trio. 2-dp.
import { clamp } from "../../core/scale.js";
import { isFiniteValue, round2 } from "../../core/types.js";

/** An x×y observation (two synchronized signals at one instant). */
export interface Pt {
  x: number;
  y: number;
}

export type Heading = 0 | 1 | 2 | 3 | 4; // up-right, up-left, down-right, down-left, steady

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
}

export function phaseTraceGeometry(opts: {
  data: readonly Pt[];
  xDomain: [number, number];
  yDomain: [number, number];
  tail: number;
  width: number;
  height: number;
}): PhaseTraceResult {
  const { data, xDomain, yDomain, tail, width, height } = opts;
  const pad = 2;
  const [x0, x1] = xDomain;
  const [y0, y1] = yDomain;
  const xSpan = x1 - x0 || 1;
  const ySpan = y1 - y0 || 1;
  const xOf = (v: number): number =>
    round2(pad + ((clamp(v, x0, x1) - x0) / xSpan) * (width - pad * 2));
  const yOf = (v: number): number =>
    round2(pad + (1 - (clamp(v, y0, y1) - y0) / ySpan) * (height - pad * 2));

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
    };
  }

  const screen = pts.map((p) => ({ x: xOf(p.x), y: yOf(p.y) }));
  const points: PhasePoint[] = pts.map((p, i) => ({
    x: screen[i]!.x,
    y: screen[i]!.y,
    dataX: p.x,
    dataY: p.y,
  }));
  const n = screen.length;
  const tailStart = Math.max(0, Math.floor((1 - Math.max(0, Math.min(1, tail))) * (n - 1)));

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
  const from = Math.max(0, tailStart);
  for (let i = from + 1; i < n; i++) {
    dx += pts[i]!.x - pts[i - 1]!.x;
    dy += pts[i]!.y - pts[i - 1]!.y;
  }
  const eps = (Math.abs(xSpan) + Math.abs(ySpan)) * 0.005;
  let heading: Heading;
  if (Math.abs(dx) < eps && Math.abs(dy) < eps) heading = 4;
  else if (dy >= 0) heading = dx >= 0 ? 0 : 1;
  else heading = dx >= 0 ? 2 : 3;

  // arrowhead along the final screen segment
  let arrow = "";
  if (n >= 2) {
    const a = screen[n - 2]!;
    const ang = Math.atan2(end.y - a.y, end.x - a.x);
    const L = Math.min(width, height) * 0.12;
    const a1 = ang + (150 * Math.PI) / 180;
    const a2 = ang - (150 * Math.PI) / 180;
    arrow = `M${end.x} ${end.y}L${round2(end.x + Math.cos(a1) * L)} ${round2(end.y + Math.sin(a1) * L)}M${end.x} ${end.y}L${round2(end.x + Math.cos(a2) * L)} ${round2(end.y + Math.sin(a2) * L)}`;
  }

  return { trailPath, tailPath, end, arrow, start, heading, points };
}
