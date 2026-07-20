import type { ChartModule, PlaygroundSpec } from "./types";
import { SpreadBand as SpreadBandInteractive } from "@microcharts/react/spread-band/interactive";
import staticModule, { playground as staticPlayground, PAIRS, LABELS } from "./spread-band";

/** Interactive half of the spread-band chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./spread-band`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <SpreadBandInteractive
      data={PAIRS}
      seriesLabels={LABELS}
      summary={false}
      width={140}
      height={26}
      animate
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <SpreadBandInteractive
      data={PAIRS}
      seriesLabels={LABELS}
      label={s.label as "gap" | "none"}
      positive={s.positive as "up" | "down"}
      animate={ui.animate}
      summary={false}
      width={260}
      height={34}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<SpreadBand",
      "  data={pairs}",
      '  seriesLabels={["Organic", "Paid"]}',
      s.label !== "gap" && `  label="${s.label}"`,
      s.positive !== "up" && `  positive="${s.positive}"`,
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
