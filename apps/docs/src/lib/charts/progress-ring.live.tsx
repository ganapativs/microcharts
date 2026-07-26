import type { ChartModule, PlaygroundSpec } from "./types";
import { ProgressRing } from "@microcharts/react/progress-ring";
import { ProgressRing as ProgressRingInteractive } from "@microcharts/react/progress-ring/interactive";
import staticModule, { playground as staticPlayground } from "./progress-ring";

/** Interactive half of the progress-ring chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./progress-ring`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <ProgressRingInteractive
      value={0.68}
      summary={false}
      style={{ width: 40, height: 40 }}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <ProgressRingInteractive
      value={(s.pct as number) / 100}
      sweep={s.sweep as boolean}
      weight={s.weight as number}
      label={(s.label as boolean) ? "percent" : "none"}
      size={48}
      title="Playground"
      animate={ui.animate}
      style={{ width: 96, height: 96 }}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<ProgressRing",
      `  value={${(s.pct as number) / 100}}`,
      (s.sweep as boolean) && "  sweep",
      s.weight !== 3 && `  weight={${s.weight}}`,
      (s.label as boolean) && '  label="percent"',
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: ProgressRing,
  ChartLive: ProgressRingInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
