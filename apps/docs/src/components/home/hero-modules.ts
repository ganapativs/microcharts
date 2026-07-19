import type { ChartModule } from "@/lib/charts/types";
import sparkline from "@/lib/charts/sparkline";
import sparkbar from "@/lib/charts/sparkbar";
import miniBar from "@/lib/charts/mini-bar";
import histogramStrip from "@/lib/charts/histogram-strip";
import heatStrip from "@/lib/charts/heat-strip";
import rugStrip from "@/lib/charts/rug-strip";
import horizon from "@/lib/charts/horizon";
import seismogram from "@/lib/charts/seismogram";
import waveform from "@/lib/charts/waveform";
import cometTrail from "@/lib/charts/comet-trail";
import bumpStrip from "@/lib/charts/bump-strip";
import dualSparkline from "@/lib/charts/dual-sparkline";
import citySkyline from "@/lib/charts/city-skyline";
import constellation from "@/lib/charts/constellation";
import treeRings from "@/lib/charts/tree-rings";
import spiralYear from "@/lib/charts/spiral-year";
import moonPhase from "@/lib/charts/moon-phase";
import honeycomb from "@/lib/charts/honeycomb";
import thermometer from "@/lib/charts/thermometer";
import heartbeatBlip from "@/lib/charts/heartbeat-blip";
import microScatter from "@/lib/charts/micro-scatter";
import stackedArea from "@/lib/charts/stacked-area";
import bubbleRow from "@/lib/charts/bubble-row";
import bullet from "@/lib/charts/bullet";
import delta from "@/lib/charts/delta";
import segmentedBar from "@/lib/charts/segmented-bar";
import waterfall from "@/lib/charts/waterfall";
import slope from "@/lib/charts/slope";
import dumbbell from "@/lib/charts/dumbbell";
import microBox from "@/lib/charts/micro-box";
import streakSpark from "@/lib/charts/streak-spark";
import winProbWorm from "@/lib/charts/win-prob-worm";

/** Narrow module map for the homepage catalog board — only the slugs `POOL` can
 *  deal, so the client bundle carries ~three dozen previews instead of the entire
 *  106-chart registry (which imports every chart's static AND interactive entry).
 *  Keep in sync with POOL in `catalog-grid.tsx`; `catalog-grid.test.ts` fails if
 *  they drift. */
export const HERO_MODULES: Record<string, ChartModule> = {
  sparkline: sparkline,
  sparkbar: sparkbar,
  "mini-bar": miniBar,
  "histogram-strip": histogramStrip,
  "heat-strip": heatStrip,
  "rug-strip": rugStrip,
  horizon: horizon,
  seismogram: seismogram,
  waveform: waveform,
  "comet-trail": cometTrail,
  "bump-strip": bumpStrip,
  "dual-sparkline": dualSparkline,
  "city-skyline": citySkyline,
  constellation: constellation,
  "tree-rings": treeRings,
  "spiral-year": spiralYear,
  "moon-phase": moonPhase,
  honeycomb: honeycomb,
  thermometer: thermometer,
  "heartbeat-blip": heartbeatBlip,
  "micro-scatter": microScatter,
  "stacked-area": stackedArea,
  "bubble-row": bubbleRow,
  bullet: bullet,
  delta: delta,
  "segmented-bar": segmentedBar,
  waterfall: waterfall,
  slope: slope,
  dumbbell: dumbbell,
  "micro-box": microBox,
  "streak-spark": streakSpark,
  "win-prob-worm": winProbWorm,
};

/** The slugs the catalog board deals from — the map's own keys, so the pool and
 *  the shipped modules cannot drift apart. Insertion order is stable, which is
 *  what makes the board's first deal deterministic across SSR and hydration. */
export const POOL: readonly string[] = Object.keys(HERO_MODULES);
