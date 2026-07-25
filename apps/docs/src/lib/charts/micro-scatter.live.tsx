import type { ChartModule, PlaygroundSpec } from "./types";
import { MicroScatter } from "@microcharts/react/micro-scatter";
import { MicroScatter as MicroScatterInteractive } from "@microcharts/react/micro-scatter/interactive";
import staticModule, { playground as staticPlayground, CLOUD } from "./micro-scatter";

/** Interactive half of the micro-scatter chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./micro-scatter`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <MicroScatterInteractive
      data={CLOUD}
      summary={false}
      width={110}
      height={66}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <MicroScatterInteractive
      data={CLOUD}
      trend={s.trend as boolean}
      focal={(s.focal as boolean) ? 12 : undefined}
      r={s.r as number}
      xDomain={(s.zoom as boolean) ? [0, 12] : undefined}
      domain={(s.zoom as boolean) ? [0, 60] : undefined}
      summary={false}
      animate={ui.animate}
      width={220}
      height={132}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<MicroScatter",
      "  data={pairs}",
      (s.trend as boolean) && "  trend",
      (s.focal as boolean) && "  focal={12}",
      s.r !== 1.5 && `  r={${s.r}}`,
      (s.zoom as boolean) && "  xDomain={[0, 12]}",
      (s.zoom as boolean) && "  domain={[0, 60]}",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: MicroScatter,
  ChartLive: MicroScatterInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
