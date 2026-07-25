import type { ChartModule, PlaygroundSpec } from "./types";
import { NetFlow } from "@microcharts/react/net-flow";
import { NetFlow as NetFlowInteractive } from "@microcharts/react/net-flow/interactive";
import staticModule, { playground as staticPlayground, DEMO, KFMT } from "./net-flow";

/** Interactive half of the net-flow chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./net-flow`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <NetFlowInteractive
      data={DEMO}
      format={KFMT}
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
    <NetFlowInteractive
      data={DEMO}
      format={KFMT}
      mode={s.mode as "area" | "bars"}
      net={s.net as boolean}
      label={s.label as "last" | "none"}
      animate={ui.animate}
      summary={false}
      width={280}
      height={30}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<NetFlow",
      "  data={months}",
      s.mode !== "area" && `  mode="${s.mode}"`,
      s.net === false && "  net={false}",
      s.label !== "last" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: NetFlow,
  ChartLive: NetFlowInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
