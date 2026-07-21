// ControlStrip summary templates (control-strip) — a separate MODULE (see
// strings-scalar.ts for the chunk rationale). English lives only in core string
// modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type ControlStrings = Pick<
  SummaryStrings,
  "noData" | "control" | "controlInControl" | "controlProvisional" | "controlAt" | "controlChip"
>;

export const EN_CONTROL: ControlStrings = {
  noData: "No data.",
  control: (k, n, center, lo, hi) =>
    `${k} of ${n} points outside control limits (center ${center}, limits ${lo}–${hi}).`,
  controlInControl: (n, center, lo, hi) =>
    `All ${n} points within control limits (center ${center}, limits ${lo}–${hi}).`,
  controlProvisional: (n) => ` Limits provisional (n=${n}).`,
  controlAt: (position, total, value, side, limit) =>
    side === null
      ? `Point ${position} of ${total}: ${value} — in control.`
      : `Point ${position} of ${total}: ${value} — ${side === "upper" ? "above the upper" : "below the lower"} limit (${limit}).`,
  controlChip: (value, side, limit) =>
    side === null ? value : `${value} ${side === "upper" ? "above" : "below"} ${limit}`,
};
