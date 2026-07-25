import type { ChartModule, PlaygroundSpec } from "./types";
import { SegmentedBar } from "@microcharts/react/segmented-bar";
import { SegmentedBar as SegmentedBarInteractive } from "@microcharts/react/segmented-bar/interactive";
import staticModule, { playground as staticPlayground, MIX } from "./segmented-bar";

/** Interactive half of the segmented-bar chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./segmented-bar`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <SegmentedBarInteractive data={MIX} summary={false} width={130} height={16} />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <SegmentedBarInteractive
      data={MIX}
      label={s.label as "none" | "percent" | "value"}
      order={s.order as "data" | "desc"}
      maxSegments={s.maxSegments as number}
      summary={false}
      animate={ui.animate}
      width={260}
      height={22}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<SegmentedBar",
      "  data={mix}",
      s.label !== "percent" && `  label="${s.label}"`,
      s.order !== "data" && `  order="${s.order}"`,
      s.maxSegments !== 5 && `  maxSegments={${s.maxSegments}}`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: SegmentedBar,
  ChartLive: SegmentedBarInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
