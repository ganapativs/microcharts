import type { ChartModule, PlaygroundSpec } from "./types";
import { EtaBar } from "@microcharts/react/eta-bar";
import { EtaBar as EtaBarInteractive } from "@microcharts/react/eta-bar/interactive";
import staticModule, { playground as staticPlayground, min } from "./eta-bar";

/** Interactive half of the eta-bar chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./eta-bar`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <EtaBarInteractive
      progress={0.64}
      elapsed={3.6}
      rate={0.18}
      etaFormat={min}
      summary={false}
      width={130}
      height={14}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <EtaBarInteractive
      progress={(s.progress as number) / 100}
      elapsed={3.6}
      rate={(s.rate as number) / 100}
      label={s.label as "eta" | "percent" | "none"}
      etaFormat={min}
      animate={ui.animate}
      summary={false}
      width={300}
      height={16}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<EtaBar",
      `  progress={${((s.progress as number) / 100).toFixed(2)}}`,
      "  elapsed={3.6}",
      `  rate={${((s.rate as number) / 100).toFixed(2)}}`,
      s.label !== "eta" && `  label="${s.label}"`,
      "  etaFormat={(t) => `${Math.round(t)} min`}",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: EtaBar,
  ChartLive: EtaBarInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
