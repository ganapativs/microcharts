import type { ChartModule, PlaygroundSpec } from "./types";
import { MicroDonut } from "@microcharts/react/micro-donut";
import { MicroDonut as MicroDonutInteractive } from "@microcharts/react/micro-donut/interactive";
import staticModule, { playground as staticPlayground, MIX } from "./micro-donut";

/** Interactive half of the micro-donut chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./micro-donut`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <MicroDonutInteractive
      data={MIX}
      summary={false}
      style={{ width: 40, height: 40 }}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <MicroDonutInteractive
      data={MIX}
      maxWedges={s.maxWedges as number}
      weight={s.weight as number}
      label={s.label as "none" | "total"}
      decorative={s.decorative as boolean}
      size={48}
      summary={false}
      animate={ui.animate}
      style={{ width: 96, height: 96 }}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<MicroDonut",
      "  data={mix}",
      s.maxWedges !== 4 && `  maxWedges={${s.maxWedges}}`,
      s.weight !== 5 && `  weight={${s.weight}}`,
      s.label !== "none" && `  label="${s.label}"`,
      (s.decorative as boolean) && "  decorative",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: MicroDonut,
  ChartLive: MicroDonutInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
