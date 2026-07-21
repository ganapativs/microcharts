import type { ChartModule, PlaygroundSpec } from "./types";
import { DualSparkline } from "@microcharts/react/dual-sparkline";
import { DualSparkline as DualSparklineInteractive } from "@microcharts/react/dual-sparkline/interactive";
import staticModule, { playground as staticPlayground, US, BENCH } from "./dual-sparkline";

/** Interactive half of the dual-sparkline chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./dual-sparkline`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <DualSparklineInteractive
      data={US}
      compare={BENCH}
      summary={false}
      width={130}
      height={22}
      animate
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <DualSparklineInteractive
      data={US}
      compare={BENCH}
      label={s.label as "last" | "none"}
      dots={s.dots as "auto" | "none"}
      band={s.band ? [13, 16] : undefined}
      animate={ui.animate}
      summary={false}
      width={260}
      height={30}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<DualSparkline",
      "  data={ours}",
      "  compare={market}",
      s.label !== "none" && `  label="${s.label}"`,
      s.dots !== "auto" && `  dots="${s.dots}"`,
      s.band && "  band={[13, 16]}",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: DualSparkline,
  ChartLive: DualSparklineInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
