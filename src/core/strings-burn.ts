// BurnChart summary templates (burn-chart) — a separate MODULE (see
// strings-scalar.ts for the chunk rationale). English lives only in core string
// modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type BurnStrings = Pick<
  SummaryStrings,
  | "noData"
  | "burn"
  | "burnNoPlan"
  | "burnLanding"
  | "burnFlatlined"
  | "burnRemain"
  | "burnDone"
  | "burnAt"
  | "burnAtProjected"
>;

export const EN_BURN: BurnStrings = {
  noData: "No data.",
  burnRemain: "remain",
  burnDone: "done",
  burnFlatlined: "not finishing at the current pace",
  burn: (elapsed, total, unit, nowActual, work, verb, nowPlan, landing) =>
    `${elapsed} of ${total} ${unit}s in: ${nowActual} ${work} ${verb} vs ${nowPlan} planned — ${landing}.`,
  burnNoPlan: (elapsed, unit, nowActual, work, verb) =>
    `${elapsed} ${unit}s in: ${nowActual} ${work} ${verb}.`,
  burnLanding: (delta, unit) =>
    delta > 0
      ? `projected to finish ${delta} ${unit}s late`
      : delta < 0
        ? `projected to finish ${-delta} ${unit}s early`
        : "projected to finish on time",
  burnAt: (unit, period, nowActual, work, verb, nowPlan) =>
    nowPlan !== null
      ? `${unit} ${period}: ${nowActual} ${work} ${verb}, plan ${nowPlan}.`
      : `${unit} ${period}: ${nowActual} ${work} ${verb}.`,
  burnAtProjected: (unit, period, value, work, verb) =>
    `${unit} ${period} (projected): ${value} ${work} ${verb}.`,
};
