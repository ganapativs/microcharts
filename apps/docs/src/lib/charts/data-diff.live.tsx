import type { ChartModule, PlaygroundSpec } from "./types";
import { DataDiff } from "@microcharts/react/data-diff";
import { DataDiff as DataDiffInteractive } from "@microcharts/react/data-diff/interactive";
import staticModule, { playground as staticPlayground, DIFF } from "./data-diff";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <DataDiffInteractive data={DIFF} summary={false} width={120} height={40} animate={animate} />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <DataDiffInteractive
      data={DIFF}
      labels={s.labels as boolean}
      net={s.net as boolean}
      order={s.order as "data" | "net" | "magnitude"}
      label={s.label as "totals" | "none"}
      summary={false}
      animate={ui.animate}
      width={220}
      height={80}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<DataDiff",
      "  data={diff}",
      s.labels && "  labels",
      s.net && "  net",
      s.order !== "data" && `  order="${s.order}"`,
      s.label !== "none" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: DataDiff,
  ChartLive: DataDiffInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
