import type { ChartModule, PlaygroundSpec } from "./types";
import { LikertStrip } from "@microcharts/react/likert-strip";
import { LikertStrip as LikertStripInteractive } from "@microcharts/react/likert-strip/interactive";
import staticModule, { playground as staticPlayground, SURVEY } from "./likert-strip";

/** Interactive half of the likert-strip chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./likert-strip`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <LikertStripInteractive data={SURVEY} summary={false} width={130} height={20} />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <LikertStripInteractive
      data={SURVEY}
      neutral={s.neutral as "split" | "omit"}
      label={s.label as "ends" | "net" | "none"}
      summary={false}
      animate={ui.animate}
      width={260}
      height={26}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<LikertStrip",
      "  data={responses}",
      s.neutral !== "split" && `  neutral="${s.neutral}"`,
      s.label !== "ends" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: LikertStrip,
  ChartLive: LikertStripInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
