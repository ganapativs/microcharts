import type { ChartModule, PlaygroundSpec } from "./types";
import { SproutRow as SproutRowInteractive } from "@microcharts/react/sprout-row/interactive";
import staticModule, { playground as staticPlayground, ACCTS } from "./sprout-row";

/** Interactive half of the sprout-row chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./sprout-row`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <SproutRowInteractive data={ACCTS} summary={false} height={22} animate />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <SproutRowInteractive
      data={ACCTS}
      labels={s.labels as boolean}
      label={s.value ? "value" : "none"}
      summary={false}
      animate={ui.animate}
      height={s.labels ? 46 : 26}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<SproutRow",
      "  data={accounts}",
      s.labels && "  labels",
      s.value && '  label="value"',
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
