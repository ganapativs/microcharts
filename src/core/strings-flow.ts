// Waterfall / rank-run summary templates — a separate MODULE (see
// strings-scalar.ts for the chunk rationale). English lives only in core
// string modules (canon). Aggregate: strings.ts EN.
import type { SummaryStrings } from "./summary.js";

export type FlowStrings = Pick<
  SummaryStrings,
  "noData" | "waterfallStep" | "waterfallTotal" | "waterfall" | "rankAt" | "rankRun"
>;

export const EN_FLOW: FlowStrings = {
  noData: "No data.",
  waterfallStep: (label, delta, level) => `${label}: ${delta}, running ${level}.`,
  waterfallTotal: (level) => `Total: ${level}.`,
  waterfall: (start, end, steps, gains, losses) =>
    `From ${start} to ${end} over ${steps} steps: ${gains} gains, ${losses} losses.`,
  rankAt: (period, total, rank, unit = "Week") => `${unit} ${period} of ${total}: #${rank}.`,
  rankRun: (from, to, best, periods, unit = "weeks") =>
    `From #${from} to #${to} over ${periods} ${unit}; best #${best}.`,
};
