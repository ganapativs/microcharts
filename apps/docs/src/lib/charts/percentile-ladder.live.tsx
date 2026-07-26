import type { ChartModule, PlaygroundSpec } from "./types";
import { PercentileLadder } from "@microcharts/react/percentile-ladder";
import { PercentileLadder as PercentileLadderInteractive } from "@microcharts/react/percentile-ladder/interactive";
import staticModule, { playground as staticPlayground, LATENCY } from "./percentile-ladder";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <PercentileLadderInteractive
      data={LATENCY}
      summary={false}
      width={140}
      height={14}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, data, ui) => (
    <PercentileLadderInteractive
      data={data}
      scale={s.scale as "linear" | "log"}
      label={s.label as "ps" | "values" | "both" | "none"}
      marks={s.marks as "tick" | "dot"}
      summary={false}
      animate={ui.animate}
      width={280}
      height={18}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<PercentileLadder",
      "  data={latencies}",
      s.scale !== "linear" && `  scale="${s.scale}"`,
      s.label !== "ps" && `  label="${s.label}"`,
      s.marks !== "tick" && `  marks="${s.marks}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: PercentileLadder,
  ChartLive: PercentileLadderInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
