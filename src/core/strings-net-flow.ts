// NetFlow summary templates (net-flow) — a separate MODULE (see
// strings-scalar.ts for the chunk rationale). The net value always carries its
// sign in TEXT (direction is never color-alone). English lives only in core
// string modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type NetFlowStrings = Pick<
  SummaryStrings,
  "noData" | "netFlow" | "netFlowAt" | "netFlowNoFlow"
>;

export const EN_NET_FLOW: NetFlowStrings = {
  noData: "No data.",
  netFlow: (netLast, inLast, outLast, netPositive, n) =>
    `Net ${netLast} last period; in ${inLast} vs out ${outLast}; net positive ${netPositive} of ${n} periods.`,
  netFlowAt: (position, total, inValue, outValue, net) =>
    `Period ${position} of ${total}: in ${inValue}, out ${outValue}, net ${net}.`,
  netFlowNoFlow: (n) => `No flow across ${n} periods.`,
};
