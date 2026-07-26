import type { ChartModule, PlaygroundSpec } from "./types";
import { SegmentedBar } from "@microcharts/react/segmented-bar";
import { SegmentedBar as SegmentedBarInteractive } from "@microcharts/react/segmented-bar/interactive";
import staticModule, { playground as staticPlayground, MIX } from "./segmented-bar";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <SegmentedBarInteractive data={MIX} summary={false} width={130} height={16} animate={animate} />
  );
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
