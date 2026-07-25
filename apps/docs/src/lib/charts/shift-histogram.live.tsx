import type { ChartModule, PlaygroundSpec } from "./types";
import { ShiftHistogram } from "@microcharts/react/shift-histogram";
import { ShiftHistogram as ShiftHistogramInteractive } from "@microcharts/react/shift-histogram/interactive";
import staticModule, { playground as staticPlayground, BEFORE, AFTER, MS } from "./shift-histogram";

/** Interactive half of the shift-histogram chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./shift-histogram`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <ShiftHistogramInteractive
      data={{ before: BEFORE, after: AFTER }}
      format={MS}
      summary={false}
      width={160}
      height={24}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <ShiftHistogramInteractive
      data={{ before: BEFORE, after: AFTER }}
      format={MS}
      mode={s.mode as "mirror" | "overlay"}
      bins={s.bins === "auto" ? undefined : Number(s.bins)}
      label={s.label as "shift" | "none"}
      animate={ui.animate}
      summary={false}
      width={280}
      height={28}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<ShiftHistogram",
      "  data={{ before, after }}",
      s.mode !== "mirror" && `  mode="${s.mode}"`,
      s.bins !== "auto" && `  bins={${s.bins}}`,
      s.label !== "shift" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: ShiftHistogram,
  ChartLive: ShiftHistogramInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
