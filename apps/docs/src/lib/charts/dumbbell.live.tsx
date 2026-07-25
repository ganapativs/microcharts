import type { ChartModule, PlaygroundSpec } from "./types";
import { Dumbbell } from "@microcharts/react/dumbbell";
import { Dumbbell as DumbbellInteractive } from "@microcharts/react/dumbbell/interactive";
import staticModule, { playground as staticPlayground, BANDS } from "./dumbbell";

/** Interactive half of the dumbbell chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./dumbbell`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <DumbbellInteractive data={BANDS} summary={false} width={130} height={52} />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <DumbbellInteractive
      data={BANDS}
      positive={(s.positive as boolean) ? "up" : undefined}
      label={(s.values as boolean) ? "value" : "none"}
      highlight={(s.highlight as boolean) ? "Berlin" : undefined}
      summary={false}
      animate={ui.animate}
      width={240}
      height={96}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Dumbbell",
      "  data={bands}",
      (s.positive as boolean) && '  positive="up"',
      (s.values as boolean) && '  label="value"',
      (s.highlight as boolean) && '  highlight="Berlin"',
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: Dumbbell,
  ChartLive: DumbbellInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
