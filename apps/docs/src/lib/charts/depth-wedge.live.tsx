import type { ChartModule, PlaygroundSpec } from "./types";
import { DepthWedge } from "@microcharts/react/depth-wedge";
import { DepthWedge as DepthWedgeInteractive } from "@microcharts/react/depth-wedge/interactive";
import staticModule, { playground as staticPlayground, BOOK } from "./depth-wedge";

/** Interactive half of the depth-wedge chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./depth-wedge`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <DepthWedgeInteractive data={BOOK} summary={false} width={130} height={24} animate={animate} />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <DepthWedgeInteractive
      data={BOOK}
      normalize={s.normalize as boolean}
      label={s.label as "spread" | "none"}
      levels={s.levels as number}
      animate={ui.animate}
      summary={false}
      width={320}
      height={30}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<DepthWedge",
      "  data={{ demand, supply }}",
      s.normalize === true && "  normalize",
      s.label !== "spread" && `  label="${s.label}"`,
      s.levels !== 2 && `  levels={${s.levels}}`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: DepthWedge,
  ChartLive: DepthWedgeInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
