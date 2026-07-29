import type { AnalyticsAdapter, AnalyticsEvent } from "./types";

const adapters: AnalyticsAdapter[] = [];

export function registerAdapter(adapter: AnalyticsAdapter): void {
  if (adapters.includes(adapter)) return;
  adapters.push(adapter);
}

/** Test-only: drop all adapters. */
export function clearAdapters(): void {
  adapters.length = 0;
}

export function track(event: AnalyticsEvent): void {
  for (const adapter of adapters) adapter.track(event);
}
