import type { ChartModule } from "@/lib/charts/types";
import sparkline from "@/lib/charts/sparkline.live";
import sparkbar from "@/lib/charts/sparkbar.live";
import miniBar from "@/lib/charts/mini-bar.live";
import histogramStrip from "@/lib/charts/histogram-strip.live";
import heatStrip from "@/lib/charts/heat-strip.live";
import rugStrip from "@/lib/charts/rug-strip.live";
import horizon from "@/lib/charts/horizon.live";
import seismogram from "@/lib/charts/seismogram.live";
import waveform from "@/lib/charts/waveform.live";
import cometTrail from "@/lib/charts/comet-trail.live";
import bumpStrip from "@/lib/charts/bump-strip.live";
import dualSparkline from "@/lib/charts/dual-sparkline.live";
import citySkyline from "@/lib/charts/city-skyline.live";
import constellation from "@/lib/charts/constellation.live";
import treeRings from "@/lib/charts/tree-rings.live";
import spiralYear from "@/lib/charts/spiral-year.live";
import moonPhase from "@/lib/charts/moon-phase.live";
import honeycomb from "@/lib/charts/honeycomb.live";
import thermometer from "@/lib/charts/thermometer.live";
import heartbeatBlip from "@/lib/charts/heartbeat-blip.live";
import microScatter from "@/lib/charts/micro-scatter.live";
import stackedArea from "@/lib/charts/stacked-area.live";
import bubbleRow from "@/lib/charts/bubble-row.live";
import bullet from "@/lib/charts/bullet.live";
import delta from "@/lib/charts/delta.live";
import segmentedBar from "@/lib/charts/segmented-bar.live";
import waterfall from "@/lib/charts/waterfall.live";
import slope from "@/lib/charts/slope.live";
import dumbbell from "@/lib/charts/dumbbell.live";
import microBox from "@/lib/charts/micro-box.live";
import streakSpark from "@/lib/charts/streak-spark.live";
import winProbWorm from "@/lib/charts/win-prob-worm.live";
import { POOL } from "./hero-modules";

/**
 * Interactive twins for the homepage catalog board. Loaded ONLY after mount
 * (via dynamic import in catalog-grid) so first paint stays static SSR with
 * zero interactive chart JS. Keys must match {@link POOL}.
 */
export const HERO_MODULES_LIVE: Record<string, ChartModule> = {
  sparkline,
  sparkbar,
  "mini-bar": miniBar,
  "histogram-strip": histogramStrip,
  "heat-strip": heatStrip,
  "rug-strip": rugStrip,
  horizon,
  seismogram,
  waveform,
  "comet-trail": cometTrail,
  "bump-strip": bumpStrip,
  "dual-sparkline": dualSparkline,
  "city-skyline": citySkyline,
  constellation,
  "tree-rings": treeRings,
  "spiral-year": spiralYear,
  "moon-phase": moonPhase,
  honeycomb,
  thermometer,
  "heartbeat-blip": heartbeatBlip,
  "micro-scatter": microScatter,
  "stacked-area": stackedArea,
  "bubble-row": bubbleRow,
  bullet,
  delta,
  "segmented-bar": segmentedBar,
  waterfall,
  slope,
  dumbbell,
  "micro-box": microBox,
  "streak-spark": streakSpark,
  "win-prob-worm": winProbWorm,
};

// Fail fast if a pool slug is missing a live module (or an extra sneaks in).
if (process.env.NODE_ENV !== "production") {
  for (const slug of POOL) {
    if (!HERO_MODULES_LIVE[slug]?.PreviewLive) {
      throw new Error(`hero-modules-live missing PreviewLive for "${slug}"`);
    }
  }
}
