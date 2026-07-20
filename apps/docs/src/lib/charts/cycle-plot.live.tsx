import type { ChartModule, PlaygroundSpec } from "./types";
import { CyclePlot as CyclePlotInteractive } from "@microcharts/react/cycle-plot/interactive";
import staticModule, { playground as staticPlayground, WEEKS, DAYS } from "./cycle-plot";

/** Interactive half of the cycle-plot chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./cycle-plot`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <CyclePlotInteractive data={WEEKS} period={7} summary={false} width={100} height={24} animate />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <CyclePlotInteractive
      data={WEEKS}
      period={7}
      slots={DAYS}
      cycleUnit="weeks"
      center={s.center as "mean" | "median"}
      trend={s.trend as boolean}
      spine={s.spine as boolean}
      animate={ui.animate}
      summary={false}
      width={280}
      height={40}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<CyclePlot",
      "  data={daily}",
      "  period={7}",
      s.center !== "mean" && `  center="${s.center}"`,
      s.trend === false && "  trend={false}",
      s.spine === false && "  spine={false}",
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
