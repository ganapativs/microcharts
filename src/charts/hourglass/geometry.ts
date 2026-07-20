// Hourglass geometry — pure, React-free. The two-sided story
// Progress can't tell: sand area split top (remaining) / bottom (elapsed). Both
// are AREA-TRUE (a naive linear-height fill would overstate early progress by up
// to 2×). Closed forms: top bulb is apex-down, remaining r=1−value fills from the
// apex to height h=H·√r; bottom bulb apex-up, elapsed e=value fills from the base
// to h=H·(1−√(1−e)). All coords 2-dp.
import { round2 } from "../../core/types.js";

export interface HourglassGeometry {
  /** Curved glass silhouette (concave bulbs meeting at the neck). */
  frame: string;
  /** End-cap plates (top + bottom) — the frame chrome. */
  caps: { x: number; y: number; width: number; height: number; r: number }[];
  /** Top chamber sand (remaining) — apex-down triangle. */
  topSand: string;
  /** Bottom chamber sand (elapsed) — base-up trapezoid. */
  bottomSand: string;
  /** Falling-sand cue at the neck (only while 0 < value < 1). */
  stream: { x: number; y1: number; y2: number } | null;
  /** Top edge of the instrument — the outer face of the top cap plate. The
   *  frame, not the sand, so the seat holds at every value. */
  y0: number;
  /** Bottom edge of the instrument — the outer face of the bottom cap plate. */
  y1: number;
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
  const L = pad;
  const R = round2(width - pad);
  const capH = round2(Math.max(1.5, height * 0.08)); // frame plate thickness
  const top = round2(pad + capH); // glass top
  const bot = round2(height - pad - capH); // glass bottom
  const neck = round2(height / 2);
  const H = round2(neck - top); // chamber height (each side)

  // straight chamber walls from the wide plate to the neck point (the sand pile
  // is a cone; the glass around it is curved — as in a real hourglass). The neck
  // stays a point so the sand areas remain exactly area-true.
  const topLeft = (y: number) => round2(L + ((y - top) / (neck - top)) * (cx - L));
  const topRight = (y: number) => round2(R - ((y - top) / (neck - top)) * (R - cx));
  const botLeft = (y: number) => round2(cx - ((y - neck) / (bot - neck)) * (cx - L));
  const botRight = (y: number) => round2(cx + ((y - neck) / (bot - neck)) * (R - cx));

  // curved glass — concave sides via quadratic controls at the neck line
  const frame =
    `M${L} ${top}L${R} ${top}Q${R} ${neck} ${cx} ${neck}Q${L} ${neck} ${L} ${top}Z` +
    `M${L} ${bot}L${R} ${bot}Q${R} ${neck} ${cx} ${neck}Q${L} ${neck} ${L} ${bot}Z`;

  const capW = round2(R - L + pad); // plates overhang the glass slightly
  const caps = [
    { x: round2(L - pad / 2), y: pad, width: capW, height: capH, r: round2(capH * 0.35) },
    {
      x: round2(L - pad / 2),
      y: round2(height - pad - capH),
      width: capW,
      height: capH,
      r: round2(capH * 0.35),
    },
  ];

  // top sand — remaining, from the neck apex up to yTop = neck − H·√r
  let topSand = "";
  if (r > 0.005) {
    const yTop = round2(neck - H * Math.sqrt(r));
    topSand = `M${cx} ${neck}L${topRight(yTop)} ${yTop}L${topLeft(yTop)} ${yTop}Z`;
  }

  // bottom sand — elapsed, a mounded pile from the base up to yFill
  let bottomSand = "";
  if (e > 0.005) {
    const hb = H * (1 - Math.sqrt(1 - e));
    const yFill = round2(bot - hb);
    bottomSand = `M${L} ${bot}L${R} ${bot}L${botRight(yFill)} ${yFill}L${botLeft(yFill)} ${yFill}Z`;
  }

  const stream =
    e > 0.005 && e < 0.995 ? { x: cx, y1: round2(neck - 1), y2: round2(neck + 4) } : null;

  return { frame, caps, topSand, bottomSand, stream, y0: round2(pad), y1: round2(height - pad) };
}
