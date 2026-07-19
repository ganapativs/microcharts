import type { ChartModule, PlaygroundSpec } from "./types";
import { CalibrationStrip as CalibrationStripInteractive } from "@microcharts/react/calibration-strip/interactive";
import staticModule, { playground as staticPlayground, BINS } from "./calibration-strip";

/** Interactive half of the calibration-strip chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./calibration-strip`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <CalibrationStripInteractive data={BINS} summary={false} width={130} height={32} animate />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <CalibrationStripInteractive
      data={BINS}
      variant={s.variant as "dots" | "bars"}
      minSupport={s.minSupport as number}
      summary={false}
      animate={ui.animate}
      width={300}
      height={44}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<CalibrationStrip",
      "  data={reliability}",
      s.variant !== "dots" && `  variant="${s.variant}"`,
      s.minSupport !== 11 && `  minSupport={${s.minSupport}}`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  PreviewLive,
  playground,
} satisfies ChartModule;
