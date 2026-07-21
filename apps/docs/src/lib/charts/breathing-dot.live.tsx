import type { ChartModule, PlaygroundSpec } from "./types";
import { BreathingDot } from "@microcharts/react/breathing-dot";
import { BreathingDot as BreathingDotInteractive } from "@microcharts/react/breathing-dot/interactive";
import staticModule, { playground as staticPlayground } from "./breathing-dot";

/** Interactive half of the breathing-dot chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./breathing-dot`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <BreathingDotInteractive value={0.42} summary={false} size={20} />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s) => (
    <BreathingDotInteractive
      value={(s.value as number) / 100}
      label={s.label as "none" | "value"}
      summary={false}
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
