import type { ChartModule, PlaygroundSpec } from "./types";
import { Waterfall } from "@microcharts/react/waterfall";
import { Waterfall as WaterfallInteractive } from "@microcharts/react/waterfall/interactive";
import staticModule, { playground as staticPlayground, PL } from "./waterfall";

/** Interactive half of the waterfall chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./waterfall`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <WaterfallInteractive
      data={PL}
      open={60}
      summary={false}
      width={130}
      height={24}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <WaterfallInteractive
      data={PL}
      open={s.open as number}
      totalBar={s.totalBar as boolean}
      label={s.delta ? "delta" : "none"}
      positive={s.positive as "up" | "down"}
      animate={ui.animate}
      summary={false}
      width={260}
      height={32}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Waterfall",
      "  data={steps}",
      `  open={${s.open}}`,
      s.totalBar === false && "  totalBar={false}",
      !s.delta && '  label="none"',
      s.positive !== "up" && `  positive="${s.positive}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: Waterfall,
  ChartLive: WaterfallInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
