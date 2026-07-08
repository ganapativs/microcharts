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
import trendArrow from "./trend-arrow";
import statusDot from "./status-dot";
import heatCell from "./heat-cell";
import progress from "./progress";
import rugStrip from "./rug-strip";
import miniBar from "./mini-bar";
import pictogramRow from "./pictogram-row";
import seismogram from "./seismogram";
import heatStrip from "./heat-strip";
import dotPlot from "./dot-plot";
import dumbbell from "./dumbbell";
import pairedBars from "./paired-bars";
import slope from "./slope";
import microScatter from "./micro-scatter";
import segmentedBar from "./segmented-bar";
import histogramStrip from "./histogram-strip";
import microBox from "./micro-box";
import progressRing from "./progress-ring";
import microDonut from "./micro-donut";
import funnel from "./funnel";
import likertStrip from "./likert-strip";
import waterfall from "./waterfall";
import bumpStrip from "./bump-strip";
import dualSparkline from "./dual-sparkline";
import stackedArea from "./stacked-area";
import ohlc from "./ohlc";
import horizon from "./horizon";
import calendarStrip from "./calendar-strip";
import eventTimeline from "./event-timeline";
import coverageStrip from "./coverage-strip";
import benchmarkStrip from "./benchmark-strip";
import percentileLadder from "./percentile-ladder";
import gradedBand from "./graded-band";
import iconArray from "./icon-array";
import rateVolume from "./rate-volume";
import netFlow from "./net-flow";
import retentionCurve from "./retention-curve";
import burnChart from "./burn-chart";
import errorBudget from "./error-budget";

const MODULES: ChartModule[] = [
  sparkline,
  sparkbar,
  delta,
  bullet,
  activityGrid,
  trendArrow,
  statusDot,
  heatCell,
  progress,
  rugStrip,
  miniBar,
  pictogramRow,
  seismogram,
  heatStrip,
  dotPlot,
  dumbbell,
  pairedBars,
  slope,
  microScatter,
  segmentedBar,
  histogramStrip,
  microBox,
  progressRing,
  microDonut,
  funnel,
  likertStrip,
  waterfall,
  bumpStrip,
  dualSparkline,
  stackedArea,
  ohlc,
  horizon,
  calendarStrip,
  eventTimeline,
  coverageStrip,
  benchmarkStrip,
  percentileLadder,
  gradedBand,
  iconArray,
  rateVolume,
  netFlow,
  retentionCurve,
  burnChart,
  errorBudget,
];

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

/** The full catalog size (plan/21 §0 — every type ships before launch). */
export const CATALOG_TARGET = 100;
