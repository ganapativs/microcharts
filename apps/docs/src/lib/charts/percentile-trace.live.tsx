import type { ChartModule, PlaygroundSpec } from "./types";
import { PercentileTrace } from "@microcharts/react/percentile-trace";
import { PercentileTrace as PercentileTraceInteractive } from "@microcharts/react/percentile-trace/interactive";
import staticModule, { playground as staticPlayground, DEMO } from "./percentile-trace";

/** Interactive half of the percentile-trace chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./percentile-trace`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <PercentileTraceInteractive data={DEMO} summary={false} width={150} height={26} />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <PercentileTraceInteractive
      data={DEMO}
      showBands={s.showBands as boolean}
      positive={s.positive as "up" | "down"}
      unit="week"
      animate={ui.animate}
      summary={false}
      width={280}
      height={30}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<PercentileTrace",
      "  data={ranks}",
      s.showBands === false && "  showBands={false}",
      s.positive !== "up" && `  positive="${s.positive}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: PercentileTrace,
  ChartLive: PercentileTraceInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
