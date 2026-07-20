import type { ChartModule, PlaygroundSpec } from "./types";
import { ABStrips as ABStripsInteractive } from "@microcharts/react/ab-strips/interactive";
import staticModule, { playground as staticPlayground, A, B, MS } from "./ab-strips";

/** Interactive half of the ab-strips chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./ab-strips`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <ABStripsInteractive
      data={{ a: A, b: B }}
      format={MS}
      positive="down"
      summary={false}
      width={160}
      height={22}
      animate
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <ABStripsInteractive
      data={{ a: A, b: B }}
      format={MS}
      positive={s.positive as "up" | "down"}
      label={s.label as "delta" | "none"}
      summary={false}
      animate={ui.animate}
      width={280}
      height={26}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<ABStrips",
      "  data={{ a: control, b: test }}",
      s.positive === "down" && '  positive="down"',
      s.label !== "delta" && `  label="${s.label}"`,
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
