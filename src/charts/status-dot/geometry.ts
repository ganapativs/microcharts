// StatusDot geometry — pure, React-free. Five
// distinct silhouettes paired with semantic tokens: the shape+color pairing is
// the a11y contract (never color-alone by construction), so the glyphs must
// survive grayscale, print, and forced-colors on silhouette alone.
import { round2 } from "../../core/types.js";

export type StatusGlyph = "circle" | "triangle" | "diamond" | "ring" | "half";

export type StatusMark =
  | { kind: "circle"; cx: number; cy: number; r: number; hollow: boolean }
  | { kind: "path"; d: string }
  /** Half-filled circle: outline ring + right half-disc (busy). */
  | { kind: "half"; d: string; cx: number; cy: number; r: number };

const BOX = 8;

export function statusDotGeometry(opts: {
  width: number;
  height: number;
  glyph: StatusGlyph;
}): StatusMark {
  const { width, height, glyph } = opts;
  const s = Math.min(width, height) / BOX;
  const cx = round2(width / 2);
  const cy = round2(height / 2);
  const p = (x: number, y: number) => `${round2(cx + (x - 4) * s)} ${round2(cy + (y - 4) * s)}`;

  switch (glyph) {
    case "circle":
      return { kind: "circle", cx, cy, r: round2(3 * s), hollow: false };
    case "ring":
      // hollow: radius inset by half the ring stroke so it matches the disc's
      // optical footprint instead of overshooting it
      return { kind: "circle", cx, cy, r: round2(2.5 * s), hollow: true };
    case "triangle":
      // apex-up; sits 0.35 low of true center — optical correction for the
      // triangle's bottom-heavy mass beside circles on one row
      return { kind: "path", d: `M${p(4, 1.15)} L${p(7.45, 7.15)} L${p(0.55, 7.15)} Z` };
    case "diamond":
      return { kind: "path", d: `M${p(4, 0.6)} L${p(7.4, 4)} L${p(4, 7.4)} L${p(0.6, 4)} Z` };
    case "half": {
      const r = round2(3 * s);
      // right half-disc: top → bottom along the arc, closed through the center
      const d = `M${p(4, 1)} A${r} ${r} 0 0 1 ${p(4, 7)} Z`;
      return { kind: "half", d, cx, cy, r };
    }
  }
}
