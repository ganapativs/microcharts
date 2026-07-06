// Shared React building blocks used by every chart (plan/03). Hook-free,
// RSC-safe. Charts import Chart from here; consumers get MicroProvider.
export { Chart, type ChartProps } from "./Chart.js";
export { MicroProvider, type Preset, type MicroProviderProps } from "./MicroProvider.js";
export { SparkGroup, type SparkGroupProps } from "./SparkGroup.js";
export { nextId, labelIds, type LabelIds } from "./a11y.js";
