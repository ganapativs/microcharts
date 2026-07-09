// Hourglass geometry — pure, React-free (plan/24 #7, S4). The two-sided story
// Progress can't tell: sand area split top (remaining) / bottom (elapsed). Both
// are AREA-TRUE (a naive linear-height fill would overstate early progress by up
// to 2×). Closed forms: top bulb is apex-down, remaining r=1−value fills from the
// apex to height h=H·√r; bottom bulb apex-up, elapsed e=value fills from the base
// to h=H·(1−√(1−e)). All coords 2-dp.
import { round2 } from "../../core/types.js";

export interface HourglassGeometry {
  frame: string;
  /** Top chamber sand (remaining) — apex-down triangle. */
  topSand: string;
  /** Bottom chamber sand (elapsed) — base-up trapezoid. */
  bottomSand: string;
  /** Falling-sand cue at the neck (only while 0 < value < 1). */
  stream: { x: number; y1: number; y2: number } | null;
}

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

export function hourglassGeometry(opts: {
  value: number;
  width: number;
  height: number;
  pad: number;
}): HourglassGeometry {
  const { width, height, pad } = opts;
  const e = clamp01(Number.isFinite(opts.value) ? opts.value : 0); // elapsed
  const r = 1 - e; // remaining
  const cx = round2(width / 2);
  const top = pad;
  const bot = round2(height - pad);
  const neck = round2(height / 2);
  const L = pad;
  const R = round2(width - pad);
  const H = round2(neck - top); // chamber height (each side)

  // chamber edge x at a given y (top chamber: top→neck; bottom: neck→bottom)
  const topLeft = (y: number) => round2(L + ((y - top) / (neck - top)) * (cx - L));
  const topRight = (y: number) => round2(R - ((y - top) / (neck - top)) * (R - cx));
  const botLeft = (y: number) => round2(cx - ((y - neck) / (bot - neck)) * (cx - L));
  const botRight = (y: number) => round2(cx + ((y - neck) / (bot - neck)) * (R - cx));

  const frame = `M${L} ${top}L${R} ${top}L${cx} ${neck}ZM${cx} ${neck}L${R} ${bot}L${L} ${bot}Z`;

  // top sand — remaining triangle from the neck apex up to yTop = neck − H·√r
  let topSand = "";
  if (r > 0.005) {
    const yTop = round2(neck - H * Math.sqrt(r));
    topSand = `M${cx} ${neck}L${topLeft(yTop)} ${yTop}L${topRight(yTop)} ${yTop}Z`;
  }

  // bottom sand — elapsed trapezoid from the base up to yFill = bot − H·(1−√(1−e))
  let bottomSand = "";
  if (e > 0.005) {
    const hb = H * (1 - Math.sqrt(1 - e));
    const yFill = round2(bot - hb);
    bottomSand = `M${L} ${bot}L${R} ${bot}L${botRight(yFill)} ${yFill}L${botLeft(yFill)} ${yFill}Z`;
  }

  const stream =
    e > 0.005 && e < 0.995 ? { x: cx, y1: round2(neck - 2), y2: round2(neck + 3) } : null;

  return { frame, topSand, bottomSand, stream };
}
