// MinimapStrip summary templates (minimap-strip) — its OWN module. Fog-of-war
// is a first-class state: the unknown share is disclosed, never rendered blank.
// English lives only in core string modules (canon). Aggregate: core/strings.ts.
import type { SummaryStrings } from "./summary.js";

export type MinimapStrings = Pick<
  SummaryStrings,
  "noData" | "minimap" | "minimapUnknown" | "minimapView"
>;

export const EN_MINIMAP: MinimapStrings = {
  noData: "No data.",
  minimap: (pct, a, b, total, marks, unknownClause) =>
    `Viewing ${pct} of the whole (${a}–${b} of ${total}); ${marks} marks${unknownClause}.`,
  minimapUnknown: (pct) => `; ${pct} unknown`,
  minimapView: (a, b, total) => `Viewing ${a} to ${b} of ${total}.`,
};
