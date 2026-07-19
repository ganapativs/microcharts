import type { ChartModule, PlaygroundSpec } from "./types";
import { Horizon as HorizonInteractive } from "@microcharts/react/horizon/interactive";
import staticModule, { playground as staticPlayground, LOAD } from "./horizon";

/** Interactive half of the horizon chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./horizon`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <HorizonInteractive data={LOAD} summary={false} width={130} height={16} animate />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <HorizonInteractive
      data={LOAD.map((v, i) => v - 20 + (i % 3))}
      folds={Number(s.folds) as 2 | 3}
      mode={s.mode as "mirror" | "offset"}
      baseline={s.baseline as number}
      animate={ui.animate}
      summary={false}
      width={260}
      height={24}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Horizon",
      "  data={cpuLoad}",
      s.folds !== "2" && `  folds={${s.folds}}`,
      s.mode !== "mirror" && `  mode="${s.mode}"`,
      s.baseline !== 0 && `  baseline={${s.baseline}}`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  PreviewLive,
  playground,
} satisfies ChartModule;
