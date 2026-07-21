import type { ChartModule, PlaygroundSpec } from "./types";
import { MinimapStrip } from "@microcharts/react/minimap-strip";
import { MinimapStrip as MinimapStripInteractive } from "@microcharts/react/minimap-strip/interactive";
import staticModule, { playground as staticPlayground, DATA } from "./minimap-strip";

/** Interactive half of the minimap-strip chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./minimap-strip`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <MinimapStripInteractive data={DATA} summary={false} width={130} height={16} animate />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <MinimapStripInteractive
      data={{ ...DATA, window: [s.window as number, (s.window as number) + 140] }}
      mode={s.mode as "bars" | "heat"}
      markLane={s.markLane as boolean}
      animate={ui.animate}
      summary={false}
      width={320}
      height={20}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<MinimapStrip",
      `  data={{ content, window: [${s.window}, ${(s.window as number) + 140}], marks, known }}`,
      s.mode !== "bars" && `  mode="${s.mode}"`,
      s.markLane === false && "  markLane={false}",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: MinimapStrip,
  ChartLive: MinimapStripInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
