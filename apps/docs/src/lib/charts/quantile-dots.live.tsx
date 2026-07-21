import type { ChartModule, PlaygroundSpec } from "./types";
import { QuantileDots } from "@microcharts/react/quantile-dots";
import { QuantileDots as QuantileDotsInteractive } from "@microcharts/react/quantile-dots/interactive";
import staticModule, { playground as staticPlayground, WAITS, MIN_FMT } from "./quantile-dots";

/** Interactive half of the quantile-dots chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./quantile-dots`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <QuantileDotsInteractive
      data={WAITS}
      threshold={15}
      format={MIN_FMT}
      summary={false}
      width={150}
      height={24}
      animate
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <QuantileDotsInteractive
      data={WAITS}
      count={Number(s.count)}
      threshold={s.threshold as number}
      side={s.side as "above" | "below"}
      format={MIN_FMT}
      summary={false}
      animate={ui.animate}
      width={280}
      height={30}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<QuantileDots",
      "  data={waits}",
      `  threshold={${s.threshold}}`,
      s.count !== "20" && `  count={${s.count}}`,
      s.side !== "above" && `  side="${s.side}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: QuantileDots,
  ChartLive: QuantileDotsInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
