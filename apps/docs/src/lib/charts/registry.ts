/**
 * The chart registry — single source of truth for the shipped catalog.
 *
 * One module per chart (plan/21 §6.0.A) drives the machine catalog
 * (`/catalog.json`), gallery, playgrounds, interactive demos, sizing recipes,
 * four-contexts grid, homepage showcase, and the curated `/llms.txt`. Import
 * paths are validated against `@microcharts/react`'s `package.json#exports`
 * by a docs test (plan/20 §5.3 acceptance).
 *
 * Adding a chart = one file in this directory + one line here (plan/21 §5).
 */
import type { ChartEntry, ChartModule } from "./types";
import sparkline from "./sparkline";
import sparkbar from "./sparkbar";
import delta from "./delta";
import bullet from "./bullet";
import activityGrid from "./activity-grid";

const MODULES: ChartModule[] = [sparkline, sparkbar, delta, bullet, activityGrid];

export const CHART_MODULES: Record<string, ChartModule> = Object.fromEntries(
  MODULES.map((m) => [m.entry.slug, m]),
);

export const CHARTS: ChartEntry[] = MODULES.map((m) => m.entry);

export function getChart(slug: string): ChartEntry | undefined {
  return CHART_MODULES[slug]?.entry;
}

export function getModule(slug: string): ChartModule | undefined {
  return CHART_MODULES[slug];
}

export const STABLE_CHARTS = CHARTS.filter((c) => c.status === "stable");
