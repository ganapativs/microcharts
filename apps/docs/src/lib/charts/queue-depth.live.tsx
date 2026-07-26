import type { ChartModule, PlaygroundSpec } from "./types";
import { QueueDepth } from "@microcharts/react/queue-depth";
import { QueueDepth as QueueDepthInteractive } from "@microcharts/react/queue-depth/interactive";
import staticModule, { playground as staticPlayground, DATA, CAP } from "./queue-depth";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <QueueDepthInteractive
      data={DATA}
      capacity={CAP}
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
    <QueueDepthInteractive
      data={DATA}
      capacity={s.capacity ? CAP : undefined}
      label={s.label as "last" | "none"}
      animate={ui.animate}
      summary={false}
      width={280}
      height={30}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<QueueDepth",
      "  data={data}",
      s.capacity && "  capacity={100}",
      s.label !== "last" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: QueueDepth,
  ChartLive: QueueDepthInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
