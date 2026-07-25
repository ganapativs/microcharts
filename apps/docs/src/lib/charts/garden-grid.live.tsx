import type { ChartModule, PlaygroundSpec } from "./types";
import { GardenGrid } from "@microcharts/react/garden-grid";
import { GardenGrid as GardenGridInteractive } from "@microcharts/react/garden-grid/interactive";
import staticModule, { playground as staticPlayground, WEEKS } from "./garden-grid";

/** Interactive half of the garden-grid chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./garden-grid`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <GardenGridInteractive data={WEEKS} summary={false} cell={9} />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, data, ui) => (
    <GardenGridInteractive
      data={data}
      rows={s.rows as number}
      steps={Number(s.steps) as 3 | 5}
      empty={s.empty as "outline" | "blank"}
      summary={false}
      animate={ui.animate}
      cell={12}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<GardenGrid",
      "  data={weeks}",
      s.rows !== 7 && `  rows={${s.rows}}`,
      s.steps !== "5" && `  steps={${s.steps}}`,
      s.empty !== "outline" && `  empty="${s.empty}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: GardenGrid,
  ChartLive: GardenGridInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
