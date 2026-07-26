// HeartbeatBlip summary templates (heartbeat-blip). Event liveness over a recent window;
// the summary states the count, the window, and how long since the last event. Duration
// wording lives here (canon) so it stays translatable. Aggregate: core/strings.ts `EN`.
import type { SummaryStrings } from "./summary.js";

export type HeartbeatStrings = Pick<
  SummaryStrings,
  | "heartbeat"
  | "heartbeatFlat"
  | "heartbeatWindow"
  | "heartbeatAgo"
  | "heartbeatEmpty"
  | "heartbeatChip"
>;

export const EN_HEARTBEAT: HeartbeatStrings = {
  heartbeat: (n, windowLabel, ago) => `${n} events in the last ${windowLabel}; last ${ago} ago.`,
  heartbeatFlat: (windowLabel) => `No events in the last ${windowLabel}.`,
  heartbeatWindow: (ms) => {
    if (ms === 60_000) return "minute";
    if (ms === 3_600_000) return "hour";
    if (ms < 60_000) return `${Math.round(ms / 1000)} seconds`;
    // clean multiples of an hour (≥ 2h) read as hours, not "120 minutes"
    if (ms % 3_600_000 === 0) return `${ms / 3_600_000} hours`;
    return `${Math.round(ms / 60_000)} minutes`;
  },
  heartbeatAgo: (ms) => (ms < 60_000 ? `${Math.round(ms / 1000)}s` : `${Math.round(ms / 60_000)}m`),
  heartbeatEmpty: "no events",
  heartbeatChip: (n) => (n === 1 ? "1 event" : `${n} events`),
};
