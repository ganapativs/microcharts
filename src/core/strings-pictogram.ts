// PictogramRow templates — the scalar dictionary PLUS the per-unit announcement
// its roving keyboard needs. Its OWN module (see strings-scalar.ts for the chunk
// rationale) so the unit template rides only with the charts that rove units,
// not with every scalar glyph. English lives only in core string modules
// (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";
import { EN_SCALAR, type ScalarStrings } from "./strings-scalar.js";

export type PictogramStrings = ScalarStrings &
  Pick<SummaryStrings, "pictogramUnit" | "pictogramChip">;

export const EN_PICTOGRAM: PictogramStrings = {
  ...EN_SCALAR,
  pictogramUnit: (index, n, fill, pct) =>
    `Unit ${index} of ${n} — ${fill === "full" ? "filled" : fill === "none" ? "empty" : `${pct} filled`}.`,
  pictogramChip: (index, n, fill, pct) =>
    `${index} of ${n} — ${fill === "full" ? "filled" : fill === "none" ? "empty" : pct}`,
};
