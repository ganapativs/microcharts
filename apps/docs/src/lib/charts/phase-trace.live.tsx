import type { ChartModule, PlaygroundSpec } from "./types";
import { PhaseTrace } from "@microcharts/react/phase-trace";
import { PhaseTrace as PhaseTraceInteractive } from "@microcharts/react/phase-trace/interactive";
import staticModule, { playground as staticPlayground, TRAJ } from "./phase-trace";

/** Interactive half of the phase-trace chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./phase-trace`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <PhaseTraceInteractive
      data={TRAJ}
      xLabel="CPU"
      yLabel="Latency"
      summary={false}
      width={44}
      height={40}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <PhaseTraceInteractive
      data={TRAJ}
      xLabel="CPU"
      yLabel="Latency"
      tail={(s.tail as number) / 100}
      grid={s.grid as boolean}
      startDot={s.startDot as boolean}
      animate={ui.animate}
      summary={false}
      width={110}
      height={100}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<PhaseTrace",
      "  data={trajectory}",
      '  xLabel="CPU"',
      '  yLabel="Latency"',
      s.tail !== 25 && `  tail={${((s.tail as number) / 100).toFixed(2)}}`,
      s.grid === true && "  grid",
      s.startDot === true && "  startDot",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: PhaseTrace,
  ChartLive: PhaseTraceInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
