import type { ChartModule, PlaygroundSpec } from "./types";
import { RugStrip } from "@microcharts/react/rug-strip";
import { RugStrip as RugStripInteractive } from "@microcharts/react/rug-strip/interactive";
import staticModule, { playground as staticPlayground, FIELD } from "./rug-strip";

/** Interactive half of the rug-strip chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./rug-strip`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <RugStripInteractive
      data={FIELD}
      markValue={62}
      summary={false}
      width={120}
      height={16}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, data, ui) => (
    <RugStripInteractive
      data={data}
      markValue={(s.markValue as boolean) ? data[Math.floor(data.length / 2)] : undefined}
      orientation={s.orientation as "horizontal" | "vertical"}
      domain={(s.domain as boolean) ? [0, 150] : undefined}
      summary={false}
      animate={ui.animate}
      style={s.orientation === "vertical" ? { width: 20, height: 140 } : { width: 220, height: 22 }}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<RugStrip",
      "  data={salaries}",
      (s.markValue as boolean) && "  markValue={yourOffer}",
      s.orientation === "vertical" && '  orientation="vertical"',
      (s.domain as boolean) && "  domain={[0, 150]}",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: RugStrip,
  ChartLive: RugStripInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
