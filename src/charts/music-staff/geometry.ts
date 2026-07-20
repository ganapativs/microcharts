// MusicStaff geometry — pure, React-free. Pitch = value on a
// 5-line staff (position quantized), order = time. Pitch is the ONLY channel —
// no clefs, stems, beams or bar lines (every other notation convention is decor).
// Coincident equal values are spaced along the time axis, never dodged vertically
// (that would change pitch = lie). All coords 2-dp.
import { clamp, scaleLinear, extent } from "../../core/scale.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";

export interface MusicStaffGeometry {
  staffYs: number[];
  notes: {
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    pos: number;
    index: number;
    value: number;
  }[];
  ledger: { x1: number; x2: number; y: number }[];
  /** last note x (for the optional trailing label). */
  lastX: number | null;
  width: number;
}

export function musicStaffGeometry(opts: {
  values: readonly Value[];
  domain?: readonly [number, number] | undefined;
  width: number;
  height: number;
  range: "staff" | "ledger";
  pad: number;
}): MusicStaffGeometry {
  const { values, width, height, range, pad } = opts;
  const T = range === "staff" ? 9 : 13; // total positions (5 lines + 4 spaces, ±2 ledger)
  const staffOffset = range === "staff" ? 0 : 2; // ledger positions above the top line
  // note head sized from the nominal spacing, then the band is inset by ry so the
  // top/bottom notes never overflow the box
  const half0 = (height - 2 * pad) / (T - 1);
  // round note-heads — a wide oval reads as vertically "pressed" once scaled up,
  // so keep rx == ry (a clean disc on the staff, not a squashed ellipse).
  const ryConst = round2(half0 * 0.82);
  const rxConst = ryConst;
  const bandTop = pad + ryConst;
  const half = (height - 2 * pad - 2 * ryConst) / (T - 1);
  const posY = (p: number) => round2(bandTop + p * half);

  const staffYs = [0, 1, 2, 3, 4].map((k) => posY(staffOffset + k * 2));
  const topLine = staffOffset;
  const botLine = staffOffset + 8;

  const e = opts.domain ?? extent(values);
  const [lo, hi] = e ?? [0, 1];
  const toPos = scaleLinear([lo, hi], [T - 1, 0]); // high value → top position

  const n = values.length;
  // inset the note band by rx so the outer note ellipses don't overflow the edges
  const innerW = Math.max(0, width - 2 * pad - 2 * rxConst);
  const xAt = (i: number) => round2(pad + rxConst + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW));

  const notes: MusicStaffGeometry["notes"] = [];
  const ledger: MusicStaffGeometry["ledger"] = [];
  let lastX: number | null = null;

  values.forEach((v, i) => {
    if (!isFiniteValue(v)) return; // rest (gap)
    const pos = Math.round(clamp(toPos(v), 0, T - 1));
    const cx = xAt(i);
    const cy = posY(pos);
    notes.push({ cx, cy, rx: rxConst, ry: ryConst, pos, index: i, value: v });
    lastX = cx;
    // ledger tick when the note sits above or below the staff
    if (pos < topLine || pos > botLine) {
      ledger.push({ x1: round2(cx - 2.2), x2: round2(cx + 2.2), y: cy });
    }
  });

  return { staffYs, notes, ledger, lastX, width };
}
