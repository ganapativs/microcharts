import type { ChartModule, PlaygroundSpec } from "./types";
import { HistogramStrip } from "@microcharts/react/histogram-strip";
import { HistogramStrip as HistogramStripInteractive } from "@microcharts/react/histogram-strip/interactive";
import staticModule, { playground as staticPlayground, TIMES } from "./histogram-strip";

/** Interactive half of the histogram-strip chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./histogram-strip`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <HistogramStripInteractive
      data={TIMES}
      summary={false}
      width={130}
      height={34}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <HistogramStripInteractive
      data={TIMES}
      bins={s.bins as number}
      markValue={(s.markValue as boolean) ? 45 : undefined}
      domain={(s.domain as boolean) ? [0, 100] : undefined}
      locale={s.locale as string}
      animate={ui.animate}
      summary={false}
      width={260}
      height={64}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<HistogramStrip",
      "  data={times}",
      `  bins={${s.bins}}`,
      (s.markValue as boolean) && "  markValue={45}",
      (s.domain as boolean) && "  domain={[0, 100]}",
      (s.locale as string) !== "en-US" && `  locale="${s.locale}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: HistogramStrip,
  ChartLive: HistogramStripInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
