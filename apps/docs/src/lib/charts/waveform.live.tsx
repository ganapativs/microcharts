import type { ChartModule, PlaygroundSpec } from "./types";
import { Waveform } from "@microcharts/react/waveform";
import { Waveform as WaveformInteractive } from "@microcharts/react/waveform/interactive";
import staticModule, { playground as staticPlayground, WAVE } from "./waveform";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <WaveformInteractive data={WAVE} summary={false} width={130} height={26} animate={animate} />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <WaveformInteractive
      data={WAVE}
      mode={s.mode as "bars" | "envelope"}
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
      s.mode !== "bars" && `  mode="${s.mode}"`,
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
  Chart: Waveform,
  ChartLive: WaveformInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
