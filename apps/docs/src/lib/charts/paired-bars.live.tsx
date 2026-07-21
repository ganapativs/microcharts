import type { ChartModule, PlaygroundSpec } from "./types";
import { PairedBars } from "@microcharts/react/paired-bars";
import { PairedBars as PairedBarsInteractive } from "@microcharts/react/paired-bars/interactive";
import staticModule, { playground as staticPlayground, BUDGET } from "./paired-bars";

/** Interactive half of the paired-bars chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./paired-bars`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <PairedBarsInteractive data={BUDGET} summary={false} width={120} height={40} animate />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <PairedBarsInteractive
      data={BUDGET}
      mode={s.mode as "grouped" | "overlay"}
      positive={(s.positive as boolean) ? "up" : undefined}
      orientation={s.orientation as "horizontal" | "vertical"}
      locale={s.locale as string}
      animate={ui.animate}
      summary={false}
      style={
        s.orientation === "horizontal" ? { width: 200, height: 110 } : { width: 220, height: 72 }
      }
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<PairedBars",
      "  data={regions}",
      s.mode !== "grouped" && `  mode="${s.mode}"`,
      (s.positive as boolean) && '  positive="up"',
      s.orientation === "horizontal" && '  orientation="horizontal"',
      s.locale !== "en-US" && `  locale="${s.locale}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: PairedBars,
  ChartLive: PairedBarsInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
