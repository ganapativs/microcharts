// DepthWedge summary templates (depth-wedge) — its OWN module. The visible range
// is part of the claim, so the summary always carries "within the shown range".
// English lives only in core string modules (canon). Aggregate: core/strings.ts.
import type { SummaryStrings } from "./summary.js";

export type DepthWedgeStrings = Pick<
  SummaryStrings,
  "noData" | "depthWedge" | "depthWedgeBalanced" | "depthWedgeSides" | "depthWedgeAt"
>;

export const EN_DEPTH_WEDGE: DepthWedgeStrings = {
  noData: "No data.",
  depthWedge: (leadSide, laggSide, ratio, spread) =>
    `${leadSide} outweighs ${laggSide} ${ratio}× within the shown range; spread ${spread}.`,
  depthWedgeBalanced: (spread, sideA = "Demand", sideB = "supply") =>
    `${sideA} and ${sideB} are balanced; spread ${spread}.`,
  depthWedgeSides: ["Demand", "supply"],
  depthWedgeAt: (side, cum, dist) => `${side}: ${cum} within ${dist} of mid.`,
};
