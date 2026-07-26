import type { ChartModule, PlaygroundSpec } from "./types";
import { PercentileTrace } from "@microcharts/react/percentile-trace";
import { PercentileTrace as PercentileTraceInteractive } from "@microcharts/react/percentile-trace/interactive";
import staticModule, { playground as staticPlayground, DEMO } from "./percentile-trace";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <PercentileTraceInteractive
      data={DEMO}
      summary={false}
      width={150}
      height={26}
      animate={animate}
    />
  );
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
