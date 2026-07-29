// Hourglass: The two-sided story
// Progress can't tell: sand area split top (remaining) / bottom (elapsed). Both
// are AREA-TRUE (a naive linear-height fill would overstate early progress by up
// to 2×). Closed forms: top bulb is apex-down, remaining r=1−value fills from the
// apex to height h=H·√r; bottom bulb apex-up, elapsed e=value fills from the base
// to h=H·(1−√(1−e)). All coords 2-dp.
import { clamp } from "../../core/scale.js";
import { isFiniteValue, round2 } from "../../core/types.js";

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

/** Documented default box height (`HourglassProps.height`). */
const DEFAULT_HEIGHT = 24;
/**
 * Smallest box whose own chrome still fits inside it: a pad plus a 1.5-unit cap
 * plate at each end leaves the neck landing exactly on the plates. Below it the
 * bottom plate crosses the viewBox floor, and `.mc-root` is `overflow: visible`,
 * so it paints onto the page rather than clipping.
 */
const MIN_HEIGHT = 6;
/** Below this the cap plates, which overhang the glass by `pad`, invert. */
const MIN_WIDTH = 4;

/**
 * The instrument box, resolved once — every coordinate below derives from these
 * two numbers, never from the raw prop. `width`/`height` arrive from a host as
 * often as from a literal (a CSS var read back, a collapsed flex measurement, an
 * empty numeric input → `Number("")` → NaN), and an unresolved one reached the
 * DOM verbatim: `height={NaN}` emitted a frame of `M1 NaNL…` inside the 1×1
 * viewBox `Chart` clamps to, and `width={-20}` drew the glass at x=-21 under a
 * plate of `width="-21"`. The accessible name read normally through both.
 */
export function resolveHeight(height: number | undefined): number {
  return isFiniteValue(height) ? Math.max(MIN_HEIGHT, height) : DEFAULT_HEIGHT;
}

/**
 * Glass width. Unset, it tracks height so the instrument keeps a natural
 * hourglass proportion at any size — a fixed width made tall demos read as a
 * thin sliver.
 */
export function resolveGlassWidth(width: number | undefined, height: number): number {
  if (isFiniteValue(width)) return Math.max(MIN_WIDTH, width);
  return Math.max(12, Math.round(height * 0.66));
}

export function hourglassGeometry(opts: {
  value: number;
  width?: number | undefined;
  height: number;
  pad: number;
}): HourglassGeometry {
  const { pad } = opts;
  const height = resolveHeight(opts.height);
  const width = resolveGlassWidth(opts.width, height);
  const e = clamp(Number.isFinite(opts.value) ? opts.value : 0, 0, 1); // elapsed
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

  // The falling-sand cue is a fraction of the CHAMBER, not a fixed 5 units. The
  // constant did not survive either end of the size range: at height 8 it put y2
  // a unit past the viewBox floor (`.mc-root` is `overflow: visible`, so that
  // painted onto the page), and at height 48 it was a nub floating in a chamber
  // five times its length. These ratios reproduce the tuned 24-unit glass
  // exactly, and both ends now stay inside the glass at every size.
  const stream =
    e > 0.005 && e < 0.995
      ? { x: cx, y1: round2(neck - H * 0.11), y2: round2(neck + H * 0.44) }
      : null;

  return { frame, caps, topSand, bottomSand, stream, y0: round2(pad), y1: round2(height - pad) };
}
