import type { ChartModule, PlaygroundSpec } from "./types";
import { RetentionCurve } from "@microcharts/react/retention-curve";
import { RetentionCurve as RetentionCurveInteractive } from "@microcharts/react/retention-curve/interactive";
import staticModule, { playground as staticPlayground, DEMO, BENCH } from "./retention-curve";

/** Interactive half of the retention-curve chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./retention-curve`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <RetentionCurveInteractive
      data={DEMO}
      summary={false}
      width={150}
      height={26}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <RetentionCurveInteractive
      data={DEMO}
      benchmark={s.benchmark ? BENCH : undefined}
      plateau={s.plateau as boolean}
      curve={s.curve as "step" | "smooth"}
      unit="week"
      animate={ui.animate}
      summary={false}
      width={280}
      height={30}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<RetentionCurve",
      "  data={cohort}",
      s.benchmark && "  benchmark={industry}",
      s.plateau === false && "  plateau={false}",
      s.curve !== "step" && `  curve="${s.curve}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: RetentionCurve,
  ChartLive: RetentionCurveInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
