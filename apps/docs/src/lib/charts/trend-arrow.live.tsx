import type { ChartModule, PlaygroundSpec } from "./types";
import { TrendArrow } from "@microcharts/react/trend-arrow";
import { TrendArrow as TrendArrowInteractive } from "@microcharts/react/trend-arrow/interactive";
import staticModule, { playground as staticPlayground, PCT } from "./trend-arrow";

/** Interactive half of the trend-arrow chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./trend-arrow`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <TrendArrowInteractive value={0.3} summary={false} animate={animate} />
      <TrendArrow value={0} summary={false} />
      <TrendArrow value={-0.3} summary={false} />
    </span>
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <TrendArrowInteractive
      value={(s.pct as number) / 100}
      flatBand={(s.flatBand as number) / 100}
      glyph={s.glyph as "arrow" | "triangle" | "chevron"}
      showValue={s.showValue as boolean}
      positive={s.positive as "up" | "down"}
      format={PCT}
      title="Latency direction"
      animate={ui.animate}
      style={{ width: (s.showValue as boolean) ? 96 : 48, height: 48 }}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<TrendArrow",
      `  value={${(s.pct as number) / 100}}`,
      (s.flatBand as number) > 0 && `  flatBand={${(s.flatBand as number) / 100}}`,
      s.glyph !== "arrow" && `  glyph="${s.glyph}"`,
      (s.showValue as boolean) && "  showValue",
      s.positive === "down" && '  positive="down"',
      '  format={{ style: "percent", maximumFractionDigits: 0 }}',
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: TrendArrow,
  ChartLive: TrendArrowInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
