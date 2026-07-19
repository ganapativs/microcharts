import type { ChartModule, PlaygroundSpec } from "./types";
import { Waveform as WaveformInteractive } from "@microcharts/react/waveform/interactive";
import staticModule, { playground as staticPlayground, WAVE } from "./waveform";

/** Interactive half of the waveform chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./waveform`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <WaveformInteractive data={WAVE} summary={false} width={130} height={26} animate />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <WaveformInteractive
      data={WAVE}
      variant={s.variant as "bars" | "envelope"}
      mirror={s.mirror as boolean}
      progress={(s.progress as number) / 100}
      animate={ui.animate}
      summary={false}
      width={320}
      height={32}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Waveform",
      "  data={samples}",
      s.variant !== "bars" && `  variant="${s.variant}"`,
      s.mirror === false && "  mirror={false}",
      `  progress={${((s.progress as number) / 100).toFixed(2)}}`,
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
