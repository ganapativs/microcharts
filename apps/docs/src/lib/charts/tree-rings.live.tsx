import type { ChartModule, PlaygroundSpec } from "./types";
import { TreeRings } from "@microcharts/react/tree-rings";
import { TreeRings as TreeRingsInteractive } from "@microcharts/react/tree-rings/interactive";
import staticModule, { playground as staticPlayground, YEARS } from "./tree-rings";

/** Interactive half of the tree-rings chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./tree-rings`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <TreeRingsInteractive data={YEARS} summary={false} size={28} animate />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <TreeRingsInteractive
      data={YEARS}
      rings={s.rings as "stroke" | "fill"}
      highlight={s.highlight as "last" | "none"}
      label={s.label ? "last" : "none"}
      unit="years"
      periodWord="year"
      summary={false}
      animate={ui.animate}
      size={56}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<TreeRings",
      "  data={years}",
      s.rings !== "stroke" && `  rings="${s.rings}"`,
      s.highlight !== "last" && `  highlight="${s.highlight}"`,
      s.label && '  label="last"',
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: TreeRings,
  ChartLive: TreeRingsInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
