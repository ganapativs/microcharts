import type { ChartModule, PlaygroundSpec } from "./types";
import { CoverageStrip } from "@microcharts/react/coverage-strip";
import { CoverageStrip as CoverageStripInteractive } from "@microcharts/react/coverage-strip/interactive";
import staticModule, { playground as staticPlayground, COVERAGE } from "./coverage-strip";

/** Interactive half of the coverage-strip chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./coverage-strip`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <CoverageStripInteractive
      data={[...COVERAGE]}
      summary={false}
      width={130}
      height={12}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, data, ui) => (
    <CoverageStripInteractive
      data={data}
      expected={18}
      mode={s.mode as "binary" | "intensity"}
      shape={s.shape as "square" | "round"}
      label={s.label as "none" | "percent"}
      summary={false}
      animate={ui.animate}
      width={260}
      height={16}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<CoverageStrip",
      "  data={readings}",
      "  expected={18}",
      s.mode !== "binary" && `  mode="${s.mode}"`,
      s.shape !== "square" && `  shape="${s.shape}"`,
      s.label !== "none" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: CoverageStrip,
  ChartLive: CoverageStripInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
