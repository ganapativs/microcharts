import type { ChartModule, PlaygroundSpec } from "./types";
import { Slope } from "@microcharts/react/slope";
import { Slope as SlopeInteractive } from "@microcharts/react/slope/interactive";
import staticModule, { playground as staticPlayground, RANKS } from "./slope";

/** Interactive half of the slope chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./slope`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <SlopeInteractive data={RANKS} summary={false} width={90} height={70} />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <SlopeInteractive
      data={RANKS}
      label={s.label as "none" | "value" | "label" | "both"}
      positive={(s.positive as boolean) ? "up" : undefined}
      highlight={(s.highlight as boolean) ? "West" : undefined}
      animate={ui.animate}
      summary={false}
      width={200}
      height={130}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Slope",
      "  data={cohorts}",
      s.label !== "none" && `  label="${s.label}"`,
      (s.positive as boolean) && '  positive="up"',
      (s.highlight as boolean) && '  highlight="West"',
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: Slope,
  ChartLive: SlopeInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
