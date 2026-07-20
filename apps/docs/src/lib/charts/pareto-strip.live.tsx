import type { ChartModule, PlaygroundSpec } from "./types";
import { ParetoStrip as ParetoStripInteractive } from "@microcharts/react/pareto-strip/interactive";
import staticModule, { playground as staticPlayground, CAUSES } from "./pareto-strip";

/** Interactive half of the pareto-strip chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./pareto-strip`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <ParetoStripInteractive data={CAUSES} summary={false} width={160} height={22} animate />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <ParetoStripInteractive
      data={CAUSES}
      threshold={s.threshold as number}
      maxItems={Number(s.maxItems)}
      unit="causes"
      metric="incidents"
      label={s.label as "count" | "none"}
      animate={ui.animate}
      summary={false}
      width={280}
      height={28}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<ParetoStrip",
      "  data={causes}",
      s.threshold !== 80 && `  threshold={${s.threshold}}`,
      s.maxItems !== "8" && `  maxItems={${s.maxItems}}`,
      s.label !== "count" && `  label="${s.label}"`,
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
