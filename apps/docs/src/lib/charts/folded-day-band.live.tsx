import type { ChartModule, PlaygroundSpec } from "./types";
import { FoldedDayBand } from "@microcharts/react/folded-day-band";
import { FoldedDayBand as FoldedDayBandInteractive } from "@microcharts/react/folded-day-band/interactive";
import staticModule, { playground as staticPlayground, DATA, TODAY } from "./folded-day-band";

/** Interactive half of the folded-day-band chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./folded-day-band`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <FoldedDayBandInteractive data={DATA} summary={false} width={140} height={32} animate />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <FoldedDayBandInteractive
      data={DATA}
      today={s.today ? TODAY : undefined}
      percentiles={
        s.single
          ? [[25, 75]]
          : [
              [25, 75],
              [5, 95],
            ]
      }
      bins={s.bins as number}
      animate={ui.animate}
      summary={false}
      width={320}
      height={40}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<FoldedDayBand",
      "  data={observations}",
      s.today === true && "  today={today}",
      s.single === true && "  percentiles={[[25, 75]]}",
      s.bins !== 24 && `  bins={${s.bins}}`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: FoldedDayBand,
  ChartLive: FoldedDayBandInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
