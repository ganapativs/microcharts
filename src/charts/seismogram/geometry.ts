// Seismogram geometry — pure, React-free (plan/22 #8, S1 events). Ticks read as
// a seismograph trace: presence = density, LENGTH = intensity, centered on a
// midline so spikes flare symmetrically (the instrument's signature). Unsigned
// intensity mirrors each tick about the center; signed data keeps a zero
// baseline (up = positive, down = negative). Long series collapse via
// max-per-bucket ONLY (spikes must survive; never mean — the chart's whole job
// is showing the spike). `anomaly` flags ticks whose magnitude ≥ threshold into
// their own path so they can carry the alert token. Coords 2-dp.
import { maxPerBucket } from "../../core/downsample.js";
import { clamp, extent, scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";

interface SeismoTick {
  x: number;
  y0: number;
  y1: number;
  v: number;
  /** Magnitude ≥ `anomaly` — rendered in the alert token. */
  flag: boolean;
  /** Index into the RENDERED (possibly bucketed) series. */
  slot: number;
}

export interface SeismogramGeometry {
  /** Normal ticks — unsigned intensity, or signed data without a flag. */
  dData: string;
  /** Positive-polarity ticks (signed data only; empty otherwise). */
  dPos: string;
  /** Negative-polarity ticks (signed data only; empty otherwise). */
  dNeg: string;
  /** Anomaly-flagged ticks (`anomaly` set; empty otherwise). */
  dFlag: string;
  ticks: SeismoTick[];
  baselineY: number;
  /** True when negatives force a zero-baseline (midline drawn + polarity). */
  signed: boolean;
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
  /** Magnitude threshold; |v| ≥ anomaly flags the tick. */
  anomaly?: number | undefined;
}): SeismogramGeometry {
  const { width, height, mode } = opts;
  const pad = 0.5;
  const anomaly =
    opts.anomaly !== undefined && Number.isFinite(opts.anomaly)
      ? Math.abs(opts.anomaly)
      : undefined;

  // series longer than the width's px-slots collapse; spikes survive (abs max)
  const maxSlots = Math.max(1, Math.floor(width));
  const downsampled = opts.values.length > maxSlots;
  const values = downsampled ? maxPerBucket(opts.values, maxSlots, { abs: true }) : opts.values;

  const n = values.length;
  const center = round2(height / 2);
  if (n === 0) {
    return {
      dData: "",
      dPos: "",
      dNeg: "",
      dFlag: "",
      ticks: [],
      baselineY: center,
      signed: false,
      downsampled,
      slotW: 0,
    };
  }

  const signed = values.some((v) => isFiniteValue(v) && v < 0);
  const domain =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? opts.domain
      : (extent(values) ?? [0, 1]);

  // Signed → zero baseline, tick direction encodes sign (up = +, down = −).
  // Unsigned → centered baseline, tick mirrors both ways (seismograph trace).
  const lo = Math.min(0, domain[0]);
  const hi = Math.max(0, domain[1]);
  const scale = signed
    ? scaleLinear([lo, hi], [height - pad, pad])
    : scaleLinear([0, hi], [center, pad]); // magnitude → half-length (up from center)
  const baselineY = signed ? round2(clamp(scale(0), pad, height - pad)) : center;
  const maxHalf = center - pad;

  const slotW = width / n;
  const dataSegs: string[] = [];
  const posSegs: string[] = [];
  const negSegs: string[] = [];
  const flagSegs: string[] = [];
  const ticks: SeismoTick[] = [];

  values.forEach((v, i) => {
    if (!isFiniteValue(v) || v === 0) return;
    const x = round2(slotW * (i + 0.5));
    let y0: number;
    let y1: number;
    if (signed) {
      const yTip =
        mode === "barcode"
          ? v > 0
            ? pad
            : height - pad
          : round2(clamp(scale(v), pad, height - pad));
      y0 = round2(Math.min(baselineY, yTip));
      y1 = round2(Math.max(baselineY, yTip));
    } else {
      // symmetric about the center; magnitude → half-length each way
      const half =
        mode === "barcode" ? maxHalf : round2(clamp(center - scale(Math.abs(v)), 0, maxHalf));
      y0 = round2(center - half);
      y1 = round2(center + half);
    }
    const flag = anomaly !== undefined && Math.abs(v) >= anomaly;
    ticks.push({ x, y0, y1, v, flag, slot: i });
    const seg = `M${x} ${y0}V${y1}`;
    if (flag) flagSegs.push(seg);
    else if (signed) (v < 0 ? negSegs : posSegs).push(seg);
    else dataSegs.push(seg);
  });

  return {
    dData: dataSegs.join(""),
    dPos: posSegs.join(""),
    dNeg: negSegs.join(""),
    dFlag: flagSegs.join(""),
    ticks,
    baselineY,
    signed,
    downsampled,
    slotW,
  };
}
