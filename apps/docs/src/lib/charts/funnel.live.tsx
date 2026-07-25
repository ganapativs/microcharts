import type { ChartModule, PlaygroundSpec } from "./types";
import { Funnel } from "@microcharts/react/funnel";
import { Funnel as FunnelInteractive } from "@microcharts/react/funnel/interactive";
import staticModule, { playground as staticPlayground, PIPE } from "./funnel";

/** Interactive half of the funnel chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./funnel`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <FunnelInteractive data={PIPE} summary={false} width={130} height={40} animate={animate} />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <FunnelInteractive
      data={PIPE}
      mode={s.mode as "absolute" | "rate"}
      connectors={s.connectors as boolean}
      label={s.label as "none" | "percent" | "value"}
      highlight={(s.highlight as boolean) ? "Activated" : undefined}
      animate={ui.animate}
      summary={false}
      width={260}
      height={78}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Funnel",
      "  data={stages}",
      s.mode !== "absolute" && `  mode="${s.mode}"`,
      !(s.connectors as boolean) && "  connectors={false}",
      s.label !== "percent" && `  label="${s.label}"`,
      (s.highlight as boolean) && '  highlight="Activated"',
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: Funnel,
  ChartLive: FunnelInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
