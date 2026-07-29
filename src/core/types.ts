// Core data model. Zero React.

/** A single series value. `null` = an explicit gap (breaks lines). */
export type Value = number | null;

/** A point already mapped into pixel/viewBox space; `null` = gap. */
export type XY = readonly [number, number];

/** Polarity: which direction counts as "good". */
export type Polarity = "up" | "down";

/** Layout direction for gauge-like charts (Thermometer, TapeGauge). */
export type Orientation = "vertical" | "horizontal";

/** How a chart renders an empty (no-data) cell/unit: outlined slot or blank. */
export type EmptyCellStyle = "outline" | "blank";

/** Rounds to 2 decimals — path coords are emitted at this precision so SVG
 * output is small and attribute assertions are stable. */
export function round2(n: number): number {
  const r = Math.round(n * 100) / 100;
  // The ×100 overflows past ~1.8e306, so a FINITE input came back ±Infinity and
  // charts announced "∞" over a normally painted mark. Two decimals carry no
  // information at that magnitude — hand the value back untouched.
  return Number.isFinite(r) ? r : n;
}

/**
 * One side of a chart's box, made drawable. `width`/`height` are caller props,
 * and a non-finite one is uniquely destructive: `viewBox="0 0 NaN 20"` is
 * invalid, so the browser DROPS the attribute and the chart renders at the
 * wrong scale — with a correct-sounding accessible name still attached.
 *
 * `Chart` clamps what it puts in the viewBox, but a chart that lays its marks
 * out against the RAW prop then emits NaN coordinates inside a perfectly valid
 * frame. Both sides have to agree, so both call this: `Chart` for the frame,
 * geometry for the marks. Exported rather than re-typed per chart because a
 * copy of the expression in 106 callers cannot be kept in step.
 */
export function chartSide(v: number, fallback = 1): number {
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

/** True for a real, plottable number (not null/undefined/NaN/±Infinity). */
export function isFiniteValue(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}
