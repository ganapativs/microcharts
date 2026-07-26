// StationGlyph geometry — pure, React-free. A
// meteorological station model at word scale: a sky-cover disc (fraction filled
// as a pie sector), a wind barb reused from ../wind-barb, and corner numerals
// placed by the component. All coordinates are ABSOLUTE in the viewBox (the
// component supplies the disc center after reserving numeral gutters) — no group
// transform, so containment is honest at generation time. The barb starts at the
// disc rim, per the real station model. 2-dp.
import { round2 } from "../../core/types.js";
import { labelFont, textGutter } from "../../core/labels.js";
import { windBarbGeometry, type Seg, type WindBarbGeometry } from "../wind-barb/geometry.js";

const TAU = Math.PI * 2;

/** Minimal sky-cover pie (12 o'clock start, clockwise) — avoids pulling the
 *  whole arc module into this leaf chart's bundle. "" clear, closed disc full. */
function skyPie(cx: number, cy: number, r: number, f: number): string {
  if (f <= 0.001) return "";
  const top = round2(cy - r);
  if (f >= 0.999) {
    return `M${round2(cx)} ${top}A${r} ${r} 0 0 1 ${round2(cx)} ${round2(cy + r)}A${r} ${r} 0 0 1 ${round2(cx)} ${top}Z`;
  }
  const a = f * TAU;
  const ex = round2(cx + r * Math.sin(a));
  const ey = round2(cy - r * Math.cos(a));
  return `M${round2(cx)} ${round2(cy)}L${round2(cx)} ${top}A${r} ${r} 0 ${a > Math.PI ? 1 : 0} 1 ${ex} ${ey}Z`;
}

/**
 * Numeral gutters + disc placement, in absolute viewBox coords. Shared by the
 * static entry (which draws them) and the interactive one (which hit-tests the
 * fields), so the two can never disagree about where a numeral sits.
 */
export interface StationLayout {
  width: number;
  height: number;
  /** Label font size in viewBox units. */
  font: number;
  /** Disc center + radius. */
  cx: number;
  cy: number;
  r: number;
  /** Vertical offset of the temp / dew numerals from the disc center. */
  yOff: number;
  /** Gap between the disc rim and a numeral. */
  gap: number;
  /** Top edge of the plot box — the square holding the disc + barb. The numeral
   *  gutters sit outside it, one equal band above and below. */
  y0: number;
  /** Bottom edge of that square. */
  y1: number;
}

/**
 * Reserve a gutter per side sized to the widest numeral on it (the static path
 * never measures text — a per-char over-estimate), then place the disc center.
 *
 * The three numerals are figures this chart formatted itself (`makeFormatter`),
 * so `textGutter`'s digits rate is the right estimator — the shared one, never a
 * re-derived `* 0.62` (see core/labels.ts). Caller PROSE would need
 * `textGutterProse`; the only prose the glyph draws is the `station` id, which
 * reserves nothing at all (top-left corner, outside these gutters).
 */
export function stationLayout(opts: {
  size: number;
  temp: string | null;
  dew: string | null;
  pressure: string | null;
}): StationLayout {
  const { size } = opts;
  const font = labelFont(size, 0.24);
  const gap = 3;
  const gutW = (s: string | null): number => (s ? textGutter(s.length, font, gap) : 1);
  const padXL = round2(Math.max(gutW(opts.temp), gutW(opts.dew)) + 0.5);
  const padXR = round2(gutW(opts.pressure) + 0.5);
  const padY = round2(font + 2);
  const r = round2(size * 0.24);
  return {
    width: round2(padXL + size + padXR),
    height: round2(size + padY * 2),
    font,
    cx: round2(padXL + size / 2),
    cy: round2(padY + size / 2),
    r,
    // push temp/dew toward the top/bottom of the disc (where it is narrowest and
    // the radial barb is furthest away), so they clear both disc and barb
    yOff: round2(r * 0.78),
    gap,
    y0: padY,
    y1: round2(padY + size),
  };
}

export interface StationGlyphGeometry {
  disc: { cx: number; cy: number; r: number };
  /** Filled coverage sector (pie); "" when clear, full disc when overcast. */
  cloudPath: string;
  /** Wind barb in absolute coords, rim-anchored, or null when calm/absent. */
  barb: WindBarbGeometry | null;
  /** Rounded sky index 0–4 (clear … overcast) for the summary. */
  oktaIndex: number;
}

/** Shift a path built of absolute M/L coordinate pairs (pennants) by (dx, dy). */
function shiftPath(d: string, dx: number, dy: number): string {
  let i = 0;
  return d.replace(/-?\d*\.?\d+/g, (n) => String(round2(Number(n) + (i++ % 2 === 0 ? dx : dy))));
}

export function stationGlyphGeometry(opts: {
  cloud: number | null;
  wind: { direction: number; magnitude: number } | null;
  step: number;
  cx: number;
  cy: number;
  coreR: number;
  barbBox: number;
}): StationGlyphGeometry {
  const { cloud, wind, step, cx, cy, coreR, barbBox } = opts;

  const f = cloud == null || !Number.isFinite(cloud) ? 0 : Math.max(0, Math.min(1, cloud));
  const oktaIndex = Math.round(f * 4);
  const cloudPath = skyPie(cx, cy, coreR, f);

  let barb: WindBarbGeometry | null = null;
  if (wind && Number.isFinite(wind.magnitude) && Math.abs(wind.magnitude) >= step / 4) {
    const local = windBarbGeometry({
      direction: wind.magnitude < 0 ? wind.direction + 180 : wind.direction,
      magnitude: Math.abs(wind.magnitude),
      step,
      width: barbBox,
      height: barbBox,
    });
    const dx = round2(cx - barbBox / 2);
    const dy = round2(cy - barbBox / 2);
    const shiftSeg = (s: Seg): Seg => ({
      x1: round2(s.x1 + dx),
      y1: round2(s.y1 + dy),
      x2: round2(s.x2 + dx),
      y2: round2(s.y2 + dy),
    });
    // shaft runs from the disc center; the filled disc masks the inner part, so
    // it reads as emanating from the rim (real station model) with no extra math
    barb = {
      shaft: shiftSeg(local.shaft),
      barbs: local.barbs.map(shiftSeg),
      pennants: local.pennants.map((p) => shiftPath(p, dx, dy)),
      calm: local.calm,
      counts: local.counts,
      center: { x: cx, y: cy },
      y0: round2(local.y0 + dy),
      y1: round2(local.y1 + dy),
    };
  }

  return { disc: { cx, cy, r: coreR }, cloudPath, barb, oktaIndex };
}
