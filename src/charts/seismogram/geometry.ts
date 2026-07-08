// Seismogram geometry — pure, React-free (plan/22 #8, S1 events). Ticks from a
// baseline: presence = density, height = intensity. Long series collapse via
// max-per-bucket ONLY (spikes must survive; never mean — the chart's whole job
// is showing the spike). Signed data auto-centers the baseline. Coords 2-dp.
import { maxPerBucket } from "../../core/downsample.js";
import { clamp, extent, scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";

interface SeismoTick {
  x: number;
  y0: number;
  y1: number;
  v: number;
  /** Index into the RENDERED (possibly bucketed) series. */
  slot: number;
}

export interface SeismogramGeometry {
  /** Tick path for unsigned/positive ticks (or all, in barcode mode). */
  dPos: string;
  /** Tick path for negative ticks (empty when none). */
  dNeg: string;
  ticks: SeismoTick[];
  baselineY: number;
  /** True when the input was collapsed via max-per-bucket. */
  downsampled: boolean;
  /** Slot width for interactive x-band lookup. */
  slotW: number;
}

export function seismogramGeometry(opts: {
  width: number;
  height: number;
  values: readonly Value[];
  domain?: readonly [number, number] | undefined;
  mode: "intensity" | "barcode";
}): SeismogramGeometry {
  const { width, height, mode } = opts;
  const pad = 0.5;

  // series longer than the width's px-slots collapse; spikes survive (abs max)
  const maxSlots = Math.max(1, Math.floor(width));
  const downsampled = opts.values.length > maxSlots;
  const values = downsampled ? maxPerBucket(opts.values, maxSlots, { abs: true }) : opts.values;

  const n = values.length;
  if (n === 0) {
    return {
      dPos: "",
      dNeg: "",
      ticks: [],
      baselineY: round2(height - pad),
      downsampled,
      slotW: 0,
    };
  }

  const hasNegative = values.some((v) => isFiniteValue(v) && v < 0);
  const domain =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? opts.domain
      : (extent(values) ?? [0, 1]);
  // intensity always measures from zero — a tick's LENGTH is its magnitude
  const lo = Math.min(0, domain[0]);
  const hi = Math.max(0, domain[1]);
  const scale = hasNegative
    ? scaleLinear([lo, hi], [height - pad, pad])
    : scaleLinear([0, hi], [height - pad, pad]);
  const baselineY = round2(clamp(scale(0), pad, height - pad));

  const slotW = width / n;
  const posSegs: string[] = [];
  const negSegs: string[] = [];
  const ticks: SeismoTick[] = [];

  values.forEach((v, i) => {
    if (!isFiniteValue(v) || v === 0) return;
    const x = round2(slotW * (i + 0.5));
    // clamp guards degenerate (denormal-span) domains — ticks stay in the box
    const yTip =
      mode === "barcode"
        ? v > 0 || !hasNegative
          ? pad
          : height - pad
        : round2(clamp(scale(v), pad, height - pad));
    const y0 = round2(Math.min(baselineY, yTip));
    const y1 = round2(Math.max(baselineY, yTip));
    ticks.push({ x, y0, y1, v, slot: i });
    (v < 0 ? negSegs : posSegs).push(`M${x} ${y0}V${y1}`);
  });

  return {
    dPos: posSegs.join(""),
    dNeg: negSegs.join(""),
    ticks,
    baselineY,
    downsampled,
    slotW,
  };
}
