import type { ChartModule, PlaygroundSpec } from "./types";
import { HeatStrip } from "@microcharts/react/heat-strip";
import { HeatStrip as HeatStripInteractive } from "@microcharts/react/heat-strip/interactive";
import staticModule, { playground as staticPlayground, LOAD, D } from "./heat-strip";

/** Interactive half of the heat-strip chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./heat-strip`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <HeatStripInteractive data={LOAD} domain={D} summary={false} width={130} height={18} />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, data, ui) => (
    <HeatStripInteractive
      data={data}
      domain={D}
      steps={s.steps as number}
      shape={s.shape as "square" | "round" | "dot"}
      summary={false}
      animate={ui.animate}
      width={260}
      height={30}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<HeatStrip",
      "  data={hourlyLoad}",
      "  domain={[0, 100]}",
      s.steps !== 5 && `  steps={${s.steps}}`,
      s.shape !== "square" && `  shape="${s.shape}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: HeatStrip,
  ChartLive: HeatStripInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
