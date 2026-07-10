// Core data model (plan/03 §4). Zero React.

/** A single series value. `null` = an explicit gap (breaks lines, plan/03). */
export type Value = number | null;

/** A point already mapped into pixel/viewBox space; `null` = gap. */
export type XY = readonly [number, number];

/** Polarity: which direction counts as "good" (plan/04 rule 6). */
export type Polarity = "up" | "down";

/** Layout direction for gauge-like charts (Thermometer, TapeGauge). */
export type Orientation = "vertical" | "horizontal";

/** How a chart renders an empty (no-data) cell/unit: outlined slot or blank
 *  (plan/04 §8 ruling 7 — shared by GardenGrid, Honeycomb). */
export type EmptyCellStyle = "outline" | "blank";

/** Rounds to 2 decimals — path coords are emitted at this precision so SVG
 *  output is small and attribute assertions are stable (plan/07, plan/09). */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** True for a real, plottable number (not null/undefined/NaN/±Infinity). */
export function isFiniteValue(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}
