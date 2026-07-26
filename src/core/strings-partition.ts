// PartitionStrip summary templates (partition-strip). Two levels max; alignment is the
// comparison channel.
import type { SummaryStrings } from "./summary.js";

export type PartitionStrings = Pick<
  SummaryStrings,
  "noData" | "partition" | "partitionFlat" | "partitionAt" | "partitionParent"
>;

export const EN_PARTITION: PartitionStrings = {
  noData: "No data.",
  partition: (groups, parts, parent, child, pct) =>
    `${groups} groups, ${parts} parts; largest ${parent} → ${child} (${pct} of the whole).`,
  partitionFlat: (groups, parent, pct) =>
    `${groups} groups; largest ${parent} (${pct} of the whole).`,
  partitionAt: (label, pct, parentClause, value) =>
    `${label}: ${value}, ${pct} of the whole${parentClause}.`,
  partitionParent: (pct, parent) => `, ${pct} of ${parent}`,
};
