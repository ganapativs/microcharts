// PictogramRow templates — scalar dictionary plus per-unit announcement for
// its roving keyboard (own module so unit template doesn't tax every scalar glyph).
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
