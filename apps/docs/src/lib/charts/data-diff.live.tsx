import type { ChartModule, PlaygroundSpec } from "./types";
import { DataDiff as DataDiffInteractive } from "@microcharts/react/data-diff/interactive";
import staticModule, { playground as staticPlayground, DIFF } from "./data-diff";

/** Interactive half of the data-diff chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./data-diff`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <DataDiffInteractive data={DIFF} summary={false} width={120} height={40} animate />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <DataDiffInteractive
      data={DIFF}
      labels={s.labels as boolean}
      net={s.net as boolean}
      sort={s.sort as "none" | "net" | "magnitude"}
      label={s.label as "totals" | "none"}
      summary={false}
      animate={ui.animate}
      width={220}
      height={80}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<DataDiff",
      "  data={diff}",
      s.labels && "  labels",
      s.net && "  net",
      s.sort !== "none" && `  sort="${s.sort}"`,
      s.label !== "none" && `  label="${s.label}"`,
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
