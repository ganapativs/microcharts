import type { ChartModule, PlaygroundSpec } from "./types";
import { IconArray as IconArrayInteractive } from "@microcharts/react/icon-array/interactive";
import staticModule, { playground as staticPlayground } from "./icon-array";

/** Interactive half of the icon-array chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./icon-array`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <IconArrayInteractive value={0.15} total={20} summary={false} width={110} height={26} animate />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => {
    const total = Number(s.total) as 10 | 20 | 100;
    const tall = total === 100;
    return (
      <IconArrayInteractive
        value={(s.pct as number) / 100}
        total={total}
        label={s.label as "ratio" | "percent" | "none"}
        shape={s.shape as "square" | "round" | "dot"}
        summary={false}
        animate={ui.animate}
        width={tall ? 200 : 220}
        height={tall ? 100 : 30}
      />
    );
  },
  codeInteractive: (s, _data, ui) =>
    [
      "<IconArray",
      `  value={${((s.pct as number) / 100).toFixed(2)}}`,
      s.total !== "20" && `  total={${s.total}}`,
      s.label !== "ratio" && `  label="${s.label}"`,
      s.shape !== "square" && `  shape="${s.shape}"`,
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
