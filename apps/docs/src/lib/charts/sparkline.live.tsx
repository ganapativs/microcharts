import type { ChartModule, PlaygroundSpec } from "./types";
import { Sparkline } from "@microcharts/react/sparkline";
import { Sparkline as SparklineInteractive } from "@microcharts/react/sparkline/interactive";
import staticModule, { entry, playground as staticPlayground } from "./sparkline";

/** Interactive half of the sparkline chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./sparkline`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <SparklineInteractive data={entry.demo} width={180} height={48} dots="minmax" summary={false} />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, data, ui) => (
    <SparklineInteractive
      data={data}
      width={340}
      height={92}
      curve={s.curve as "linear" | "smooth" | "step"}
      dots={s.dots as "auto" | "minmax" | "none"}
      fill={s.fill as boolean}
      band={s.band ? [10, 26] : undefined}
      label={s.label as "none" | "last" | "minmax"}
      animate={ui.animate}
      className="w-full max-w-md"
      title="Playground"
    />
  ),
  codeInteractive: (s, data, ui) =>
    [
      "<Sparkline",
      `  data={[${data.join(", ")}]}`,
      `  curve="${s.curve}"`,
      `  dots="${s.dots}"`,
      s.fill && "  fill",
      s.band && "  band={[10, 26]}",
      s.label !== "none" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: Sparkline,
  ChartLive: SparklineInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
