// ProgressRing geometry — pure, React-free. Arc sweep from a
// FIXED 12-o'clock start, clockwise, butt caps — the two quiet ways rings
// inflate progress, both removed. `sweep` mode renders the REMAINING fraction
// (countdown semantics). 2-dp via core/arc.
//
// The value arc is a STROKED open centerline at mid-radius (stroke-width =
// weight), not a filled annulus sector. Two reasons, one mechanism: (1) the
// shared accent CSS strokes any accent `<path>` (a filled sector would render
// as a hollow outline), and (2) a stroked arc's length is drawable — the
// entrance sweeps it around the clock from 12 o'clock via stroke-dashoffset.
// The full-circle track stays a filled annulus band; both occupy the same
// radial band [rInner, rOuter], so they align exactly.
import { annulusSector, arcPath, TAU } from "../../core/arc.js";
import { round2 } from "../../core/types.js";

export interface RingGeometry {
  /** Full annulus track (filled band). */
  track: string;
  /** Value arc — a stroked open centerline at mid-radius. */
  arc: string;
  /** Stroke width for the value arc = ring band thickness (viewBox units). */
  weight: number;
  labelX: number;
  labelY: number;
  /** Center font size in viewBox units. */
  fontSize: number;
}

export function ringGeometry(opts: {
  size: number;
  fraction: number;
  weight: number;
  sweep: boolean;
}): RingGeometry {
  const { size, sweep } = opts;
  const c = size / 2;
  const rOuter = c - 0.5;
  const weight = Math.min(Math.max(opts.weight, 1), rOuter - 0.5);
  const rInner = rOuter - weight;
  const rMid = round2((rOuter + rInner) / 2);
  const f = Math.min(1, Math.max(0, opts.fraction));

  const track = annulusSector(c, c, rOuter, rInner, 0, TAU);
  // Progress shows the DONE fraction; sweep/countdown shows what REMAINS.
  const shown = sweep ? 1 - f : f;
  const arc = shown > 0 ? arcPath(c, c, rMid, 0, shown * TAU) : "";

  const fontSize = Math.max(5, Math.round(rInner * 0.9));
  return {
    track,
    arc,
    weight: round2(weight),
    labelX: round2(c),
    labelY: round2(c),
    fontSize,
  };
}
