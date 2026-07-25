import type { ChartModule, PlaygroundSpec } from "./types";
import { QueueDepth } from "@microcharts/react/queue-depth";
import { QueueDepth as QueueDepthInteractive } from "@microcharts/react/queue-depth/interactive";
import staticModule, { playground as staticPlayground, DATA, CAP } from "./queue-depth";

/** Interactive half of the queue-depth chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./queue-depth`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <QueueDepthInteractive data={DATA} capacity={CAP} summary={false} width={150} height={26} />
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
