import type { ChartModule, PlaygroundSpec } from "./types";
import { MoonPhase } from "@microcharts/react/moon-phase";
import { MoonPhase as MoonPhaseInteractive } from "@microcharts/react/moon-phase/interactive";
import staticModule, { playground as staticPlayground } from "./moon-phase";

/** Interactive half of the moon-phase chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./moon-phase`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return (
    <span className="inline-flex items-center gap-3">
      {[0.1, 0.35, 0.5, 0.75, 1].map((v) => (
        <MoonPhaseInteractive key={v} value={v} summary={false} size={20} />
      ))}
    </span>
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s) => (
    <MoonPhaseInteractive
      value={(s.value as number) / 100}
      mode={s.mode as "progress" | "cycle"}
      title="Playground"
      size={44}
    />
  ),
  codeInteractive: (s) =>
    [
      "<MoonPhase",
      `  value={${((s.value as number) / 100).toFixed(2)}}`,
      s.mode !== "progress" && `  mode="${s.mode}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: MoonPhase,
  ChartLive: MoonPhaseInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
