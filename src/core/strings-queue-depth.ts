// QueueDepth summary templates (queue-depth). Backlog stock vs capacity: is the queue
// draining or growing?
import type { SummaryStrings } from "./summary.js";

export type QueueDepthStrings = Pick<
  SummaryStrings,
  | "noData"
  | "queueDepth"
  | "queueOver"
  | "queueUnder"
  | "queueGrow"
  | "queueDrain"
  | "queueFlat"
  | "queueAt"
  | "queueAbove"
>;

export const EN_QUEUE_DEPTH: QueueDepthStrings = {
  noData: "No data.",
  queueDepth: (depth, capacityClause, trend) =>
    `${depth} queued${capacityClause}, ${trend} over the last quarter.`,
  queueOver: (ratio) => `, ${ratio}× capacity`,
  queueUnder: ", within capacity",
  queueGrow: "growing",
  queueDrain: "draining",
  queueFlat: "holding steady",
  queueAt: (period, value, breachClause) => `t${period}: ${value} queued${breachClause}.`,
  queueAbove: ", above capacity",
};
