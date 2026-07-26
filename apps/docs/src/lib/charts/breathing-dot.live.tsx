import type { ChartModule, PlaygroundSpec } from "./types";
import { BreathingDot } from "@microcharts/react/breathing-dot";
import { BreathingDot as BreathingDotInteractive } from "@microcharts/react/breathing-dot/interactive";
import staticModule, { playground as staticPlayground } from "./breathing-dot";

export function PreviewLive() {
  return <BreathingDotInteractive value={0.42} summary={false} size={20} />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s) => (
    <BreathingDotInteractive
      value={(s.value as number) / 100}
      label={s.label as "none" | "value"}
      title="Load"
      size={64}
    />
  ),
  codeInteractive: (s) =>
    [
      "<BreathingDot",
      `  value={${((s.value as number) / 100).toFixed(2)}}`,
      s.label !== "none" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: BreathingDot,
  ChartLive: BreathingDotInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
