export type { AnalyticsAdapter, AnalyticsEvent, CopyKind } from "./types";
export { clearAdapters, registerAdapter, track } from "./track";
export { gaAdapter } from "./adapters/ga";
