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

/** Narrow module map for the homepage hero — only the slugs the LivingCatalog
 *  POOL can deal, so the client bundle carries ~two dozen previews instead of the
 *  entire 106-chart registry. Keep in sync with POOL in `living-catalog.tsx`. */
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
};
