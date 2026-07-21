import type { ChartModule, PlaygroundSpec } from "./types";
import { PartitionStrip } from "@microcharts/react/partition-strip";
import { PartitionStrip as PartitionStripInteractive } from "@microcharts/react/partition-strip/interactive";
import staticModule, { playground as staticPlayground, TREE } from "./partition-strip";

/** Interactive half of the partition-strip chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./partition-strip`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <PartitionStripInteractive data={TREE} summary={false} width={140} height={24} animate />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <PartitionStripInteractive
      data={TREE}
      labels={s.labels as boolean}
      emphasis={s.emphasis === "none" ? undefined : (s.emphasis as string)}
      summary={false}
      animate={ui.animate}
      width={320}
      height={30}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<PartitionStrip",
      "  data={bundle}",
      s.labels === false && "  labels={false}",
      s.emphasis !== "none" && `  emphasis="${s.emphasis}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: PartitionStrip,
  ChartLive: PartitionStripInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
