import type { ChartModule, PlaygroundSpec } from "./types";
import { SpiralYear } from "@microcharts/react/spiral-year";
import { SpiralYear as SpiralYearInteractive } from "@microcharts/react/spiral-year/interactive";
import staticModule, { playground as staticPlayground, YEAR } from "./spiral-year";

/** Interactive half of the spiral-year chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./spiral-year`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <SpiralYearInteractive data={YEAR} summary={false} size={40} />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <SpiralYearInteractive
      data={YEAR}
      steps={s.steps === "3" ? 3 : 5}
      mark={s.mark as "dot" | "arc"}
      monthTicks={s.monthTicks === "on"}
      animate={ui.animate}
      summary={false}
      size={128}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<SpiralYear",
      "  data={byWeek}",
      s.steps !== "5" && `  steps={${s.steps}}`,
      s.mark !== "dot" && `  mark="${s.mark}"`,
      s.monthTicks !== "on" && "  monthTicks={false}",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: SpiralYear,
  ChartLive: SpiralYearInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
