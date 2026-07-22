// PolarClock geometry — pure, React-free. The shape of
// a day/week cycle: each segment is a radial bar at its fixed cycle angle,
// length ∝ value, growing from an inner baseline r0 outward. 0 at 12 o'clock,
// clockwise (core/arc convention). The channel is radial LENGTH from r0, never
// sector area — r0 > 0 reduces the outer-area distortion, and bars are always
// zero-anchored. `mode="opacity"` switches to fixed-length sectors whose 5-step
// fill opacity carries the value (a radial ActivityGrid for tiny sizes). All
// coords 2-dp.
import { annulusSector } from "../../core/arc.js";
import { round2, type Value } from "../../core/types.js";
import { maxOf, minOf } from "../../core/scale.js";

const TAU = Math.PI * 2;

/** 5-step opacity ramp for `mode="opacity"` (level 0 = quiet-but-present). */
const OPACITY_STEPS = [0.15, 0.35, 0.55, 0.75, 1] as const;

interface PolarSegment {
  index: number;
  /** Cycle position (0 = 12 o'clock slot), after `origin` rotation. */
  pos: number;
  a0: number;
  a1: number;
  /** Outer radius (length mode) or rMax (opacity mode). */
  rOuter: number;
  /** Quantized 0–4 level (opacity mode). */
  level: number;
  value: number;
  isNull: boolean;
}

export interface PolarClockGeometry {
  guide: { cx: number; cy: number; r: number };
  segments: PolarSegment[];
  /** Merged annulus sectors (length mode); "" in opacity mode. */
  segmentsPath: string;
  /** The `now` segment re-drawn, or null. */
  accentPath: string | null;
  /** Grouped full-length sectors by opacity level (opacity mode); [] otherwise. */
  levelPaths: { opacity: number; d: string }[];
  /** The four cardinal tick marks (0, ¼, ½, ¾ of the cycle) merged into one
   *  path — the at-rest orientation cue, one node instead of four (`labels`). */
  cardinalPath: string;
  peakIndex: number;
  minIndex: number;
  /** True when every finite value is equal (flat cycle). */
  flat: boolean;
  domainMax: number;
  size: number;
}

/**
 * `origin` normalized to a slot index in `[0, n)`: floored, wrapped, and 0 for
 * anything non-finite. Exported because the interactive entry must invert the
 * SAME rotation the paint applied — normalizing there separately (or not at
 * all) turned `origin={1.5}` into a fractional index that matches no segment,
 * and the dial stopped answering the pointer.
 */
export function polarStart(origin: number, n: number): number {
  return n > 0 && Number.isFinite(origin) ? ((Math.floor(origin) % n) + n) % n : 0;
}

export function polarClockGeometry(opts: {
  values: readonly Value[];
  size: number;
  inner: number;
  origin: number;
  pad: number;
  mode: "length" | "opacity";
  now?: number | undefined;
}): PolarClockGeometry {
  const { size, pad, mode } = opts;
  const n = opts.values.length;
  const cx = round2(size / 2);
  const cy = round2(size / 2);
  const rMax = size / 2 - pad;
  const inner = Number.isFinite(opts.inner) ? Math.min(0.9, Math.max(0, opts.inner)) : 0.35;
  const r0 = rMax * inner;
  const start = polarStart(opts.origin, n);

  const guide = { cx, cy, r: round2(r0) };
  const empty: PolarClockGeometry = {
    guide,
    segments: [],
    segmentsPath: "",
    accentPath: null,
    levelPaths: [],
    cardinalPath: "",
    peakIndex: -1,
    minIndex: -1,
    flat: false,
    domainMax: 0,
    size: Math.max(1, Math.round(size)),
  };
  if (n === 0) return empty;

  const finite = opts.values
    .map((v, index) => ({ v, index }))
    .filter(
      (e): e is { v: number; index: number } => typeof e.v === "number" && Number.isFinite(e.v),
    );
  if (finite.length === 0) return empty;

  const vals = finite.map((e) => e.v);
  const max = maxOf(vals, 0);
  const minV = minOf(vals);
  const maxV = maxOf(vals);
  const flat = maxV === minV;

  // First argmax / argmin over the finite segments.
  let peakIndex = finite[0]!.index;
  let minIndex = finite[0]!.index;
  let pv = finite[0]!.v;
  let mv = finite[0]!.v;
  for (const e of finite) {
    if (e.v > pv) {
      pv = e.v;
      peakIndex = e.index;
    }
    if (e.v < mv) {
      mv = e.v;
      minIndex = e.index;
    }
  }

  const slot = TAU / n;
  // Small angular gap so wedges read as separate marks.
  const gap = Math.min(slot * 0.12, 0.08);

  const segments: PolarSegment[] = [];
  for (let index = 0; index < n; index++) {
    const raw = opts.values[index];
    const isNull = !(typeof raw === "number" && Number.isFinite(raw));
    const value = isNull ? NaN : (raw as number);
    const pos = (((index - start) % n) + n) % n;
    const a0 = pos * slot + gap;
    const a1 = (pos + 1) * slot - gap;
    let rOuter = r0;
    let level = 0;
    if (!isNull) {
      if (mode === "opacity") {
        rOuter = rMax;
        level = max <= 0 ? 0 : Math.min(4, Math.max(0, Math.ceil((value / max) * 5) - 1));
      } else {
        const frac = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
        rOuter = r0 + frac * (rMax - r0);
      }
    }
    segments.push({
      index,
      pos,
      a0: round2(a0),
      a1: round2(a1),
      rOuter: round2(rOuter),
      level,
      value,
      isNull,
    });
  }

  let segmentsPath = "";
  const levelBuckets: string[] = ["", "", "", "", ""];
  for (const s of segments) {
    if (s.isNull) continue;
    if (mode === "opacity") {
      // Full-length sector at this level (value carried by opacity, not length).
      levelBuckets[s.level] += annulusSector(cx, cy, rMax, r0, s.a0, s.a1);
    } else {
      if (s.rOuter > r0 + 0.01) segmentsPath += annulusSector(cx, cy, s.rOuter, r0, s.a0, s.a1);
    }
  }

  const levelPaths =
    mode === "opacity"
      ? levelBuckets
          .map((d, level) => ({ opacity: OPACITY_STEPS[level]!, d }))
          .filter((e) => e.d.length > 0)
      : [];

  // Accent the `now` segment (both modes): its sector re-drawn.
  let accentPath: string | null = null;
  const nowIdx = opts.now;
  if (typeof nowIdx === "number" && nowIdx >= 0 && nowIdx < n) {
    const s = segments[nowIdx]!;
    if (!s.isNull) {
      const rO = mode === "opacity" ? rMax : s.rOuter;
      if (rO > r0 + 0.01) accentPath = annulusSector(cx, cy, rO, r0, s.a0, s.a1);
    }
  }

  // Cardinal ticks at 0, ¼, ½, ¾ of the cycle — hairline marks just outside
  // rMax, merged into one path (the at-rest orientation cue: one node, not four).
  const cardinalPath = [0, 0.25, 0.5, 0.75]
    .map((f) => {
      const a = f * TAU;
      const inR = rMax + 0.3;
      const outR = rMax + 1.4;
      const x1 = round2(cx + inR * Math.sin(a));
      const y1 = round2(cy - inR * Math.cos(a));
      const x2 = round2(cx + outR * Math.sin(a));
      const y2 = round2(cy - outR * Math.cos(a));
      return `M${x1} ${y1}L${x2} ${y2}`;
    })
    .join("");

  return {
    guide,
    segments,
    segmentsPath,
    accentPath,
    levelPaths,
    cardinalPath,
    peakIndex,
    minIndex,
    flat,
    domainMax: round2(max),
    size: Math.max(1, Math.round(size)),
  };
}
