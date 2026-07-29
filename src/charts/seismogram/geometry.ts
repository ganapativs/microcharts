// Seismogram: Ticks read as
// a seismograph trace: presence = density, LENGTH = intensity, centered on a
// midline so spikes flare symmetrically (the instrument's signature). Unsigned
// intensity mirrors each tick about the center; signed data keeps a zero
// baseline (up = positive, down = negative). Long series collapse via
// max-per-bucket ONLY (spikes must survive; never mean — the chart's whole job
// is showing the spike). `anomaly` flags ticks whose magnitude ≥ threshold into
// their own path so they can carry the alert token. Coords 2-dp.
import { maxPerBucket } from "../../core/downsample.js";
import { clamp, extent, scaleLinear } from "../../core/scale.js";
import { chartSide, isFiniteValue, round2, type Value } from "../../core/types.js";

export const DEFAULT_WIDTH = 60;
export const DEFAULT_HEIGHT = 16;

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
  const { mode } = opts;
  // The box is a caller prop, and a bad one is destructive in a way a bad value
  // is not: `Chart` clamps what it puts in the viewBox, so a NaN width shipped
  // `M NaN` ticks and `--mc-seat: NaN` inside a perfectly valid frame, and a
  // negative one put the collapsed tick at x = −30 — ink outside the box, which
  // `.mc-root`'s `overflow: visible` spills rather than clips (see `chartSide`).
  const width = chartSide(opts.width, DEFAULT_WIDTH);
  const height = chartSide(opts.height, DEFAULT_HEIGHT);
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
  const fit: readonly [number, number] = extent(values) ?? [0, 1];
  // A host computes `domain`, so it arrives however its min/max came out. A
  // reversed pair is a WINDOW, not a mirrored axis — RugStrip settled that —
  // and is read low→high either way.
  const given =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? opts.domain[0] <= opts.domain[1]
        ? opts.domain
        : ([opts.domain[1], opts.domain[0]] as const)
      : fit;

  // Zero-anchored either way: signed keeps 0 inside the domain so the baseline
  // IS the zero line; unsigned measures magnitude up from 0.
  const anchor = (d: readonly [number, number]): readonly [number, number] => [
    signed ? Math.min(0, d[0]) : 0,
    Math.max(0, d[1]),
  ];
  let [lo, hi] = anchor(given);
  // A window with nothing left to scale against (`[0, 0]`, or one entirely
  // below zero for unsigned magnitudes) sent every tick to the scale midpoint:
  // signed data collapsed to zero-length ticks — a strip that paints as empty
  // while its name announces a peak — and unsigned data to one uniform
  // half-length, which reads as barcode mode. Fall back to the extent a
  // `domain`-less caller already gets, so the painted scale stays the announced
  // one.
  if (lo === hi) [lo, hi] = anchor(fit);

  // Signed → zero baseline, tick direction encodes sign (up = +, down = −).
  // Unsigned → centered baseline, tick mirrors both ways (seismograph trace):
  // magnitude → half-length up from center.
  const scale = scaleLinear([lo, hi], [signed ? height - pad : center, pad]);
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
