import type { ChartModule, PlaygroundSpec } from "./types";
import { GradedBand } from "@microcharts/react/graded-band";
import { GradedBand as GradedBandInteractive } from "@microcharts/react/graded-band/interactive";
import staticModule, { playground as staticPlayground, DRAWS } from "./graded-band";

/** Interactive half of the graded-band chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./graded-band`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <GradedBandInteractive data={DRAWS} summary={false} width={140} height={14} animate={animate} />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, data, ui) => (
    <GradedBandInteractive
      data={data}
      levels={s.levels === "50/90" ? [50, 90] : [50, 80, 95]}
      softEdge={s.softEdge as boolean}
      label={s.label as "none" | "median"}
      animate={ui.animate}
      summary={false}
      width={280}
      height={16}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<GradedBand",
      "  data={posterior}",
      s.levels === "50/90" && "  levels={[50, 90]}",
      s.softEdge && "  softEdge",
      s.label !== "none" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: GradedBand,
  ChartLive: GradedBandInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
