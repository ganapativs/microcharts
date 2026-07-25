import type { ChartModule, PlaygroundSpec } from "./types";
import { RubricStrip } from "@microcharts/react/rubric-strip";
import { RubricStrip as RubricStripInteractive } from "@microcharts/react/rubric-strip/interactive";
import staticModule, { playground as staticPlayground, RUBRIC } from "./rubric-strip";

/** Interactive half of the rubric-strip chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./rubric-strip`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <RubricStripInteractive
      data={RUBRIC}
      summary={false}
      width={120}
      height={30}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <RubricStripInteractive
      data={RUBRIC}
      labels={s.labels as boolean}
      target={s.showTarget ? (s.target as number) / 100 : undefined}
      summary={false}
      animate={ui.animate}
      width={260}
      height={40}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<RubricStrip",
      "  data={criteria}",
      s.labels === false && "  labels={false}",
      s.showTarget && `  target={${((s.target as number) / 100).toFixed(2)}}`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: RubricStrip,
  ChartLive: RubricStripInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
