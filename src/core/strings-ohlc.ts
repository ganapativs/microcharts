// OHLC summary templates — a separate MODULE (see strings-scalar.ts for the
// chunk rationale).
import type { SummaryStrings } from "./summary.js";

export type OhlcStrings = Pick<SummaryStrings, "noData" | "ohlcAt" | "ohlcRun">;

export const EN_OHLC: OhlcStrings = {
  noData: "No data.",
  ohlcAt: (pos, total, o, h, l, c) =>
    `Period ${pos} of ${total}: open ${o}, high ${h}, low ${l}, close ${c}.`,
  ohlcRun: (periods, close, direction, changePct, lo, hi) =>
    `${periods} periods. Last close ${close}${
      direction === "flat" ? ", unchanged" : `, ${direction} ${changePct}`
    }; range ${lo} to ${hi}.`,
};
