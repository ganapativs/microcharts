import type { ChartModule, PlaygroundSpec } from "./types";
import { PartitionStrip } from "@microcharts/react/partition-strip";
import { PartitionStrip as PartitionStripInteractive } from "@microcharts/react/partition-strip/interactive";
import staticModule, { playground as staticPlayground, TREE } from "./partition-strip";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <PartitionStripInteractive
      data={TREE}
      summary={false}
      width={140}
      height={24}
      animate={animate}
    />
  );
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
