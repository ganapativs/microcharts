// StationGlyph geometry — pure, React-free (plan/25 §20, plan/17 F2). A
// meteorological station model at word scale: a sky-cover disc (fraction filled
// as a pie sector), a wind barb reused from ../wind-barb, and corner numerals
// placed by the component. All coordinates are ABSOLUTE in the viewBox (the
// component supplies the disc center after reserving numeral gutters) — no group
// transform, so containment is honest at generation time. The barb starts at the
// disc rim, per the real station model. 2-dp.
import { round2 } from "../../core/types.js";
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
    };
  }

  return { disc: { cx, cy, r: coreR }, cloudPath, barb, oktaIndex };
}
