import type { ChartModule, PlaygroundSpec } from "./types";
import { ConfusionGrid } from "@microcharts/react/confusion-grid";
import { ConfusionGrid as ConfusionGridInteractive } from "@microcharts/react/confusion-grid/interactive";
import staticModule, { playground as staticPlayground, CATDOG, THREE } from "./confusion-grid";

/** Interactive half of the confusion-grid chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./confusion-grid`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <ConfusionGridInteractive data={CATDOG} summary={false} size={48} animate />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <ConfusionGridInteractive
      data={THREE}
      normalize={s.normalize as "row" | "none"}
      accent={s.accent as "diagonal" | "errors"}
      label={s.label ? "accuracy" : "none"}
      shape={s.round ? "round" : "square"}
      summary={false}
      animate={ui.animate}
      size={120}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<ConfusionGrid",
      "  data={{ labels, counts }}",
      s.normalize !== "row" && `  normalize="${s.normalize}"`,
      s.accent !== "diagonal" && `  accent="${s.accent}"`,
      s.label === true && '  label="accuracy"',
      s.round === true && '  shape="round"',
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: ConfusionGrid,
  ChartLive: ConfusionGridInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
