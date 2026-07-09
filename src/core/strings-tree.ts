// TreeRings summary templates (tree-rings) — its OWN module. Radial thickness =
// per-period value; the summary names the latest and biggest period. English
// lives only in core string modules (canon). Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type TreeStrings = Pick<SummaryStrings, "noData" | "treeRings" | "treeRingAt">;

export const EN_TREE: TreeStrings = {
  noData: "No data.",
  treeRings: (n, unit, last, max, argmaxLabel) =>
    `${n} ${unit}; latest ${last}, biggest ${max} in ${argmaxLabel}.`,
  treeRingAt: (label, value) => `${label}: ${value}.`,
};
